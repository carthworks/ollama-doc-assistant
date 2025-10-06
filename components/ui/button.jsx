export default function Button({ children, ...props }) {
  return (
    <button
      {...props}
      style={{
        padding: '8px 12px',
        borderRadius: 8,
        border: 'none',
        background: '#111827',
        color: 'white',
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );
}
