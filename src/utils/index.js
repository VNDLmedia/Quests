// Utility functions
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('de-DE');
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

