import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

import { db } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import emailjs from '@emailjs/browser'; // EmailJS

function App() {
  const [data, setData] = useState([]);
  const [latest, setLatest] = useState(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const fetchData = () => {
    fetch('https://docs.google.com/spreadsheets/d/1jg69wCkwXo8v6ARHgZFPay5lXXZCFMQkOmeLqeMQchs/gviz/tq?tqx=out:json')
      .then(res => res.text())
      .then(text => {
        const json = JSON.parse(text.substr(47).slice(0, -2));
        const rows = json.table.rows;

        const processed = rows.map((row, i) => {
          const c = row.c;
          return {
            id: i + 1,
            time: c[1]?.f?.split(' ')[1] || '',
            temp: +c[2]?.v || 0,
            pulse: +c[3]?.v || 0,
            spo2: +c[4]?.v || 0,
            roll: +c[5]?.v || 0,
            urine: c[6]?.v || 0
          };
        });

        setData(processed);
        setLatest(processed.at(-1));
      });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email && phone) {
      await addDoc(collection(db, 'users'), { email, phone });

      // Optional: send welcome email (not alert)
      const templateParams = {
        user_email: email,
        user_phone: phone,
        message: 'You have successfully registered for BabySphere alerts.',
      };

      // Use your EmailJS service ID, template ID, and public API key here
      emailjs.send('service_9cj6q2r', 'template_r2lrocb', templateParams, 'DzrejDF1P_Qliqe89')
        .then((res) => console.log('Registration email sent!', res.status))
        .catch((err) => console.error('Failed to send email', err));

      setSubmitted(true);
      setEmail('');
      setPhone('');
    }
  };

  const sendAlertEmail = async (reading) => {
    // Fetch all the users from the Firebase database
    const snapshot = await getDocs(collection(db, 'users'));
  
    snapshot.forEach((doc) => {
      const user = doc.data();  // Get the user data (email and phone)
      const templateParams = {
        user_email: user.email,  // Use the email stored in Firestore
        user_phone: user.phone,
        message: `⚠️ Alert!\nBaby’s parameter crossed safe threshold.\n\nTemp: ${reading.temp}°C\nPulse: ${reading.pulse} bpm\nSpO₂: ${reading.spo2}%`,
      };
  
      // Send the alert email to each user's email
      emailjs.send('service_9cj6q2r', 'template_r2lrocb', templateParams, 'DzrejDF1P_Qliqe89')
        .then(() => {
          console.log('Alert email sent to', user.email);
        })
        .catch((err) => {
          console.error('Alert email failed to send to', user.email, err);
        });
    });
  };
  
  

  useEffect(() => {
    if (latest) {
      const { temp, pulse, spo2 } = latest;
      if (temp > 38 || pulse > 150 || spo2 < 90) {
        console.warn('⚠️ Threshold Alert!');
        sendAlertEmail(latest); // 🚨 send alert to all registered users
      }
    }
  }, [latest]);

  const chart = (key, color, label) => (
    <div style={{ height: 150 }}>
      <div style={{ textAlign: 'center', marginBottom: 5, fontWeight: 'bold' }}>{label}</div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="id" hide />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey={key} stroke={color} name={label} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <h1 style={{ textAlign: 'center' }}>BabySphere 👶</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20, textAlign: 'center' }}>
        <h3>Register for Alerts</h3>
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ marginRight: 10 }}
        />
        <input
          type="tel"
          placeholder="Enter phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          style={{ marginRight: 10 }}
        />
        <button type="submit">Submit</button>
        {submitted && <p style={{ color: 'green' }}>Details submitted!</p>}
      </form>

      {latest && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 15, marginBottom: 30 }}>
          <div><b>Time:</b><br />{latest.time}</div>
          <div><b>Temp:</b><br />{latest.temp}°C</div>
          <div><b>Pulse:</b><br />{latest.pulse} bpm</div>
          <div><b>SpO₂:</b><br />{latest.spo2}%</div>
          <div><b>Roll:</b><br />{latest.roll}°</div>
          <div><b>Urine:</b><br />{latest.urine}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {chart('temp', '#FF5733', 'Temp')}
        {chart('pulse', '#2980B9', 'Pulse')}
        {chart('spo2', '#27AE60', 'SpO₂')}
        {chart('roll', '#8E44AD', 'Roll')}
      </div>

      <div style={{ textAlign: 'center', marginTop: 30 }}>
        <a
          href="https://docs.google.com/spreadsheets/d/1jg69wCkwXo8v6ARHgZFPay5lXXZCFMQkOmeLqeMQchs/edit"
          target="_blank"
          rel="noreferrer"
        >
          <button style={{
            padding: '10px 20px',
            background: '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            See Entire Data
          </button>
        </a>
      </div>
    </div>
  );
}

export default App;
