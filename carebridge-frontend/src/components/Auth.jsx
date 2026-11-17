import React, { useState } from 'react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('senior'); // 'senior' or 'volunteer'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    city: 'Lahti',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(isLogin ? 'Login Data:' : 'Register Data:', { ...formData, role });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>CareBridge {isLogin ? 'Login' : 'Register'}</h2>
        
        <div style={styles.toggleContainer}>
          <button 
            type="button"
            style={isLogin ? styles.activeTab : styles.tab} 
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            type="button"
            style={!isLogin ? styles.activeTab : styles.tab} 
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.roleContainer}>
            <label>I am a:</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.input}>
              <option value="senior">Senior (Seeking Help)</option>
              <option value="volunteer">Volunteer (Offering Support)</option>
            </select>
          </div>

          {!isLogin && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              style={styles.input}
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            style={styles.input}
          />

          {!isLogin && (
            <>
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                type="text"
                name="city"
                placeholder="City (e.g., Lahti)"
                value={formData.city}
                onChange={handleChange}
                style={styles.input}
              />
            </>
          )}

          <button type="submit" style={styles.submitBtn}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' },
  card: { padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', backgroundColor: '#fff', width: '360px' },
  toggleContainer: { display: 'flex', marginBottom: '20px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #ccc' },
  tab: { flex: 1, padding: '10px', border: 'none', background: '#f0f0f0', cursor: 'pointer' },
  activeTab: { flex: 1, padding: '10px', border: 'none', background: '#007bff', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  roleContainer: { display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'left' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' },
  submitBtn: { padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#28a745', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }
};

export default Auth;