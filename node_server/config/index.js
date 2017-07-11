/*
 This reads the hash as 'secret' for development environments and calls on an environment variable when in production
*/

module.exports = {
  secret: process.env.NODE_ENV === 'production' ? process.env.SECRET : 'secret'
};
