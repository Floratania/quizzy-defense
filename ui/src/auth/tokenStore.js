export const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

export const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem('accessToken', token);
  }
};

export const clearAccessToken = () => {
  localStorage.removeItem('accessToken');
};
