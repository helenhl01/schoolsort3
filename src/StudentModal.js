import { useEffect } from 'react';

function formatLabel(key){
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, c => c.toUpperCase());
}

function formatValue(value){
  if(value === true){ return "Yes"; }
  if(value === false){ return "No"; }
  if(value === undefined || value === null || value === ""){ return "—"; }
  return String(value);
}

function StudentModal({student, onClose}){
  useEffect(() => {
    if(!student){ return; }
    const handleKeydown = (e) => {
      if(e.key === "Escape"){ onClose(); }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [student, onClose]);

  if(!student){ return null; }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        <h2 className="modal-name">{student.firstName + " " + student.lastName}</h2>
        {Object.entries(student).map(([key, value]) =>
          key === "firstName" || key === "lastName" ? null :
          <p key={key}>{formatLabel(key)}: {formatValue(value)}</p>
        )}
      </div>
    </div>
  );
}

export default StudentModal;
