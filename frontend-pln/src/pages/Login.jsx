import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, FloatingLabel } from 'react-bootstrap';
import api from '../services/api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // Password Eye
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const response = await api.post('/login', { email, password });

        const token = response.data.token;
        const user = response.data.user;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        if (user.role === 'admin') {
            navigate('/dashboard-admin');
        } else if (user.role === 'manajer') {
            navigate('/dashboard-manajer');
        } else if (user.role === 'petugas') {
            navigate('/dashboard-petugas');
        } else {
            setError('Role user tidak dikenali.');
            localStorage.clear();
            navigate('/login');
        }
    } catch (err) {
        setError(err.response?.data?.message || 'Email atau password salah!');
    } finally {
        setLoading(false);
    }
};

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: `linear-gradient(rgba(35, 40, 45, 0.8), rgba(15, 18, 20, 0.95)), url('https://rricoid-assets.obs.ap-southeast-4.myhuaweicloud.com/berita/Semarang/o/1747013882794-IMG-20250512-WA0012/dcth2igpmb0a8tr.jpeg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px' 
        }}>
            <Container className="mx-auto" style={{ maxWidth: '380px', padding: '0 5px' }}>
                <Card className="border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
                    
                    {/* Warna lis box*/}
                    <div style={{ height: '5px', background: '#005b8f', width: '100%' }}></div>

                    <Card.Body className="p-4">
                        <div className="text-center mb-4 mt-2">
                            <img 
                                src="https://upload.wikimedia.org/wikipedia/commons/9/97/Logo_PLN.png" 
                                alt="Logo PLN" 
                                style={{ width: '70px', marginBottom: '12px' }} 
                            />
                            
                            <h5 className="fw-bold text-dark mb-0" style={{ letterSpacing: '-0.3px', fontSize: '1.15rem' }}>
                                Aplikasi Pemeliharaan APP TR
                            </h5>
                            <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.8rem', fontWeight: '500' }}>Tak Langsung - PT PLN (Persero) UP3 Palembang</p>
                        </div>

                        {error && <Alert variant="danger" className="py-2 text-center" style={{ fontSize: '0.8rem', borderRadius: '8px' }}>{error}</Alert>}

                        <Form onSubmit={handleLogin}>
                            <FloatingLabel controlId="floatingEmail" label="Alamat Email" className="mb-3 text-muted" style={{ fontSize: '0.85rem' }}>
                                <Form.Control 
                                    type="email" 
                                    placeholder="name@example.com" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required 
                                    className="border-0 bg-light fw-medium text-dark shadow-sm"
                                    style={{ borderRadius: '10px', height: '55px', fontSize: '0.9rem' }}
                                />
                            </FloatingLabel>

                            {/* Password Field */}
                            <div className="position-relative mb-4">
                                <FloatingLabel controlId="floatingPassword" label="Kata Sandi" className="text-muted" style={{ fontSize: '0.85rem' }}>
                                    <Form.Control 
                                        type={showPassword ? 'text' : 'password'} 
                                        placeholder="Password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required 
                                        className="border-0 bg-light fw-medium text-dark shadow-sm pe-5"
                                        style={{ borderRadius: '10px', height: '55px', fontSize: '0.9rem' }}
                                    />
                                </FloatingLabel>
                                
                                {/* Tombol Mata */}
                                <span 
                                    className="position-absolute" 
                                    style={{ right: '15px', top: '16px', cursor: 'pointer', color: '#6c757d', zIndex: 10 }}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        // (Sembunyikan)
                                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l-.708-.709z"/>
                                            <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                                            <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                                        </svg>
                                    ) : (
                                        // (Lihat)
                                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                                            <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                                        </svg>
                                    )}
                                </span>
                            </div>

                            <Button 
                                variant="primary" 
                                type="submit" 
                                className="w-100 fw-bold py-3 shadow-sm"
                                style={{ 
                                    borderRadius: '10px', 
                                    background: '#005b8f', // Warna tombol biru
                                    border: 'none',
                                    fontSize: '0.95rem',
                                    letterSpacing: '0.5px'
                                }}
                                disabled={loading}
                            >
                                {loading ? 'Memeriksa Data...' : 'Login'}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
                
                <div className="text-center mt-3 text-white" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', textShadow: '0px 2px 4px rgba(0,0,0,0.8)' }}>
                    &copy; 2026 Muhammad Alhaqi
                </div>
            </Container>
        </div>
    );
}