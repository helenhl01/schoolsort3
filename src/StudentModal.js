import { useEffect, useState } from 'react';

function CopyIcon(){
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}

function CheckIcon(){
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function CopyableField({label, value}){
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if(!copied){ return; }
    const timeoutId = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timeoutId);
  }, [copied]);

  function handleCopy(){
    navigator.clipboard.writeText(value || "");
    setCopied(true);
  }

  return (
    <p>
      <span className="modal-field-label">{label}:</span> {value}
      <button type="button" className="modal-copy-btn" onClick={handleCopy} aria-label={`Copy ${label}`}>
        {copied ? <CheckIcon/> : <CopyIcon/>}
      </button>
    </p>
  );
}

const AVAILABILITY_FIELDS = [
  ["monday1", "Monday 2:30"], ["monday2", "Monday 3:30"],
  ["tuesday1", "Tuesday 2:30"], ["tuesday2", "Tuesday 3:30"],
  ["wednesday1", "Wednesday 2:30"], ["wednesday2", "Wednesday 3:30"],
  ["thursday1", "Thursday 2:30"], ["thursday2", "Thursday 3:30"],
];

function formatSemsInSEEK(semsInSEEK){
  return semsInSEEK > 0 ? `${semsInSEEK} semester${semsInSEEK === 1 ? "" : "s"} in SEEK` : "First semester in SEEK";
}

function formatAvailability(student){
  return AVAILABILITY_FIELDS.filter(([key]) => student[key]).map(([, label]) => label).join(", ");
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

  const hasSchool = student.schoolName && student.schoolName !== "Unsorted";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>

        {student.po && <p className="modal-role-badge">PO</p>}
        {student.exec && <p className="modal-role-badge">Exec</p>}

        <div className="modal-header">
          <h2 className="modal-name">{student.firstName + " " + student.lastName}</h2>
          <span className="modal-grad-date">{student.gradDate}</span>
        </div>
        <p className="modal-major">{student.major}</p>
        <p className="modal-sems-in-seek">{formatSemsInSEEK(student.semsInSEEK)}</p>

        <p className="modal-section-header">Contact Information:</p>
        <CopyableField label="Email" value={student.email} />
        <CopyableField label="Phone" value={student.phone} />
        <CopyableField label="Eid" value={student.eid} />

        <p className="modal-section-header">Information:</p>
        {hasSchool ?
          <p><span className="modal-field-label">School assignment:</span> {student.schoolName}</p> :
          <p className="modal-no-school">No school currently assigned</p>
        }
        <p><span className="modal-field-label">Availability:</span> {formatAvailability(student)}</p>
        {student.carSpace > 0 &&
          <p><span className="modal-field-label">Car Space:</span> {student.carSpace}</p>
        }
        <p>
          <span className="modal-field-label">YPP Training complete:</span>{" "}
          <span className={student.trainingComplete ? "modal-value-yes" : "modal-value-no"}>
            {student.trainingComplete ? "Yes" : "No"}
          </span>
        </p>

        <p className="modal-section-header">Additional:</p>
        <p><span className="modal-field-label">T-Shirt Size:</span> {student.tshirtSize}</p>
        {student.availabilityNotes &&
          <p><span className="modal-field-label">Availability Notes:</span> "{student.availabilityNotes}"</p>
        }
      </div>
    </div>
  );
}

export default StudentModal;
