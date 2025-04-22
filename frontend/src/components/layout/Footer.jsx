import React from 'react';

function Footer() {
  return (
    <footer
      style={{
        textAlign: 'center',
        padding: '1rem',
        borderTop: '1px solid #eaeaea',
        marginTop: '2rem',
      }}
    >
      <p>© {new Date().getFullYear()} Harmonic Universe. All rights reserved.</p>
    </footer>
  );
}

export default Footer;
