import { useEffect, useState } from 'react';
import { AVAILABILITY_FIELDS } from './configs.js';

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

function PencilIcon(){
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
      <path d="M15 5l4 4"/>
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

function EditableField({label, value, field, onChange, type = "text"}){
  return (
    <p>
      <span className="modal-field-label">{label}:</span>{" "}
      <input
        type={type}
        className="modal-edit-input"
        value={value ?? ""}
        onChange={e => onChange(field, type === "number" ? Number(e.target.value) : e.target.value)}
      />
    </p>
  );
}

function EditableCheckbox({label, checked, field, onChange}){
  return (
    <label className="modal-edit-checkbox">
      <input type="checkbox" checked={!!checked} onChange={e => onChange(field, e.target.checked)} />
      {" "}{label}
    </label>
  );
}

function formatSemsInSEEK(semsInSEEK){
  return semsInSEEK > 0 ? `${semsInSEEK} semester${semsInSEEK === 1 ? "" : "s"} in SEEK` : "First semester in SEEK";
}

function formatAvailability(student){
  return AVAILABILITY_FIELDS.filter(([key]) => student[key]).map(([, label]) => label).join(", ");
}

function StudentModal({student, onClose, onSave, onDelete}){
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if(!student){ return; }
    const handleKeydown = (e) => {
      if(e.key === "Escape"){ onClose(); }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [student, onClose]);

  useEffect(() => {
    setIsEditing(false);
    setDraft(null);
  }, [student]);

  function startEditing(){
    setDraft({...student});
    setIsEditing(true);
  }

  function handleFieldChange(field, value){
    setDraft(prev => ({...prev, [field]: value}));
  }

  function handleSave(){
    onSave({...student, ...draft});
    setIsEditing(false);
    setDraft(null);
  }

  function handleCancel(){
    setIsEditing(false);
    setDraft(null);
  }

  function handleDelete(){
    if(window.confirm(`Delete ${student.firstName} ${student.lastName}? This cannot be undone.`)){
      onDelete(student);
      onClose();
    }
  }

  if(!student){ return null; }

  const hasSchool = student.schoolName && student.schoolName !== "Unsorted";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-edit" onClick={startEditing} disabled={isEditing} aria-label="Edit"><PencilIcon/></button>
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>

        {isEditing ?
          <>
            <EditableCheckbox label="PO" checked={draft.po} field="po" onChange={handleFieldChange} />
            <EditableCheckbox label="Exec" checked={draft.exec} field="exec" onChange={handleFieldChange} />
          </>
          :
          <>
            {student.po && <p className="modal-role-badge">PO</p>}
            {student.exec && <p className="modal-role-badge">Exec</p>}
          </>
        }

        <div className="modal-header">
          {isEditing ?
            <>
              <span className="modal-edit-field">
                <span className="modal-edit-label">First Name</span>
                <input className="modal-edit-input" value={draft.firstName ?? ""} onChange={e => handleFieldChange("firstName", e.target.value)} placeholder="First name" />
              </span>
              <span className="modal-edit-field">
                <span className="modal-edit-label">Last Name</span>
                <input className="modal-edit-input" value={draft.lastName ?? ""} onChange={e => handleFieldChange("lastName", e.target.value)} placeholder="Last name" />
              </span>
              <span className="modal-edit-field">
                <span className="modal-edit-label">Graduation Date</span>
                <input className="modal-edit-input" value={draft.gradDate ?? ""} onChange={e => handleFieldChange("gradDate", e.target.value)} placeholder="Grad date" />
              </span>
            </>
            :
            <>
              <h2 className="modal-name">{student.firstName + " " + student.lastName}</h2>
              <span className="modal-grad-date">{student.gradDate}</span>
            </>
          }
        </div>
        {isEditing ?
          <span className="modal-edit-field">
            <span className="modal-edit-label">Major</span>
            <input className="modal-edit-input" value={draft.major ?? ""} onChange={e => handleFieldChange("major", e.target.value)} placeholder="Major" />
          </span>
          :
          <p className="modal-major">{student.major}</p>
        }
        {isEditing ?
          <EditableField label="Semesters in SEEK" value={draft.semsInSEEK} field="semsInSEEK" onChange={handleFieldChange} type="number" />
          :
          <p className="modal-sems-in-seek">{formatSemsInSEEK(student.semsInSEEK)}</p>
        }

        <p className="modal-section-header">Contact Information:</p>
        {isEditing ?
          <>
            <EditableField label="Email" value={draft.email} field="email" onChange={handleFieldChange} />
            <EditableField label="Phone" value={draft.phone} field="phone" onChange={handleFieldChange} />
            <EditableField label="Eid" value={draft.eid} field="eid" onChange={handleFieldChange} />
          </>
          :
          <>
            <CopyableField label="Email" value={student.email} />
            <CopyableField label="Phone" value={student.phone} />
            <CopyableField label="Eid" value={student.eid} />
          </>
        }

        <p className="modal-section-header">Information:</p>
        {hasSchool ?
          <p><span className="modal-field-label">School assignment:</span> {student.schoolName}</p> :
          <p className="modal-no-school">No school currently assigned</p>
        }
        {isEditing ?
          <>
            <span className="modal-edit-label">Availability</span>
            <div className="modal-availability-grid">
              {AVAILABILITY_FIELDS.map(([key, label]) => (
                <EditableCheckbox key={key} label={label} checked={draft[key]} field={key} onChange={handleFieldChange} />
              ))}
            </div>
          </>
          :
          <p><span className="modal-field-label">Availability:</span> {formatAvailability(student)}</p>
        }
        {isEditing ?
          <EditableField label="Car Space" value={draft.carSpace} field="carSpace" onChange={handleFieldChange} type="number" />
          :
          student.carSpace > 0 &&
            <p><span className="modal-field-label">Car Space:</span> {student.carSpace}</p>
        }
        {isEditing ?
          <EditableCheckbox label="YPP Training complete" checked={draft.trainingComplete} field="trainingComplete" onChange={handleFieldChange} />
          :
          <p>
            <span className="modal-field-label">YPP Training complete:</span>{" "}
            <span className={student.trainingComplete ? "modal-value-yes" : "modal-value-no"}>
              {student.trainingComplete ? "Yes" : "No"}
            </span>
          </p>
        }

        <p className="modal-section-header">Additional:</p>
        {isEditing ?
          <EditableField label="T-Shirt Size" value={draft.tshirtSize} field="tshirtSize" onChange={handleFieldChange} />
          :
          <p><span className="modal-field-label">T-Shirt Size:</span> {student.tshirtSize}</p>
        }
        {isEditing ?
          <p>
            <span className="modal-field-label">Availability Notes:</span>{" "}
            <textarea className="modal-edit-textarea" value={draft.availabilityNotes ?? ""} onChange={e => handleFieldChange("availabilityNotes", e.target.value)} />
          </p>
          :
          student.availabilityNotes &&
            <p><span className="modal-field-label">Availability Notes:</span> "{student.availabilityNotes}"</p>
        }
        {isEditing ?
          <p>
            <span className="modal-field-label">Notes:</span>{" "}
            <textarea className="modal-edit-textarea" value={draft.notes ?? ""} onChange={e => handleFieldChange("notes", e.target.value)} />
          </p>
          :
          student.notes &&
            <p><span className="modal-field-label">Notes:</span> {student.notes}</p>
        }

        {isEditing &&
          <div className="modal-edit-actions">
            <button type="button" className="modal-save-btn" onClick={handleSave}>Save</button>
            <button type="button" className="modal-cancel-btn" onClick={handleCancel}>Cancel</button>
          </div>
        }
        {isEditing &&
          <button type="button" className="modal-delete-btn" onClick={handleDelete}>Delete</button>
        }
      </div>
    </div>
  );
}

export default StudentModal;
