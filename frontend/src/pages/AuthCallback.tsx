import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      // Decode JWT to get user info without verifying signature (backend did that)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userInfo = {
            _id: payload.id,
            role: payload.role,
            token: token,
        };
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        toast.success('Login com sucesso!');
        navigate('/');
      } catch (error) {
        toast.error('Token de autenticação inválido.');
        navigate('/login');
      }
    } else {
      toast.error('Falha na autenticação social.');
      navigate('/login');
    }
  }, [location, navigate]);

  return <div>Autenticando...</div>;
};

export default AuthCallback;