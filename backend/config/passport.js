import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const configurePassport = () => {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        // GARANTIA DE ADMIN: Se o usuário existente for você, garanta que ele seja admin
        if (user.email === 'russelmytho@gmail.com' && user.role !== 'admin') {
          user.role = 'admin';
          await user.save();
        }
        logger.logEvent('AUTH', `Usuário existente logou com Google: ${user.email}`);
        return done(null, user);
      }
      
      let existingUser = await User.findOne({ email: profile.emails[0].value });

      if (existingUser) {
        existingUser.googleId = profile.id;
        // GARANTIA DE ADMIN: Se o usuário existente for você, garanta que ele seja admin
        if (existingUser.email === 'russelmytho@gmail.com' && existingUser.role !== 'admin') {
            existingUser.role = 'admin';
        }
        await existingUser.save();
        logger.logEvent('AUTH', `Conta Google conectada ao email existente: ${existingUser.email}`);
        return done(null, existingUser);
      }

      user = new User({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        isVerified: true 
      });

      // GARANTIA DE ADMIN: Se o novo usuário for você, defina como admin
      if (user.email === 'russelmytho@gmail.com') {
        user.role = 'admin';
      }

      await user.save();
      logger.logEvent('AUTH', `Novo usuário registrado com Google: ${user.email}`);
      done(null, user);
    } catch (err) {
      done(err, false);
    }
  }));

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/github/callback`,
    scope: ['user:email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ githubId: profile.id });

      if (user) {
        // GARANTIA DE ADMIN: Se o usuário existente for você, garanta que ele seja admin
        if (user.email === 'russelmytho@gmail.com' && user.role !== 'admin') {
            user.role = 'admin';
            await user.save();
        }
        logger.logEvent('AUTH', `Usuário existente logou com GitHub: ${user.email}`);
        return done(null, user);
      }
      
      const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
      if (!email) {
        return done(null, false, { message: 'Não foi possível obter um e-mail do GitHub.' });
      }
      
      let existingUser = await User.findOne({ email: email });

      if (existingUser) {
        existingUser.githubId = profile.id;
        // GARANTIA DE ADMIN: Se o usuário existente for você, garanta que ele seja admin
        if (existingUser.email === 'russelmytho@gmail.com' && existingUser.role !== 'admin') {
            existingUser.role = 'admin';
        }
        await existingUser.save();
        logger.logEvent('AUTH', `Conta GitHub conectada ao email existente: ${existingUser.email}`);
        return done(null, existingUser);
      }

      user = new User({
        githubId: profile.id,
        name: profile.displayName,
        email: email,
        isVerified: true
      });

      // GARANTIA DE ADMIN: Se o novo usuário for você, defina como admin
      if (user.email === 'russelmytho@gmail.com') {
        user.role = 'admin';
      }

      await user.save();
      logger.logEvent('AUTH', `Novo usuário registrado com GitHub: ${user.email}`);
      done(null, user);
    } catch (err) {
      done(err, false);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
  });
};

export default configurePassport;