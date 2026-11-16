const SyllabusBranding = ({ children, university }) => {
  const isAlte = university === "ALTE";

  return (
    <div className={`syllabus-document ${isAlte ? "alte-document" : ""}`}>
      {isAlte && (
        <div className="syllabus-header">
          <img src="/images/alte-header.png" alt="ALTE University" />
        </div>
      )}

      <div className="syllabus-content">{children}</div>

      {isAlte && <div className="syllabus-footer">ALTE UNIVERSITY</div>}
    </div>
  );
};
