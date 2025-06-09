import jsPDF from "jspdf";

export const downloadSyllabusAsPDF = (form) => {
    if (!form?.content?.length) return;

    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(16);
    doc.text(form.title || "Syllabus", 10, y);
    y += 10;

    form.content.forEach((section, idx) => {
        doc.setFontSize(14);
        doc.text(`${section.title || `Section ${idx + 1}`}:`, 10, y);
        y += 8;

        (section.cells || []).forEach((cell) => {
            doc.setFontSize(12);
            doc.text(`- ${cell.label || "Label"}: ${cell.value || "—"}`, 12, y);
            y += 7;
            if (y > 280) {
                doc.addPage();
                y = 10;
            }
        });

        y += 5;
    });

    doc.save(`${form.title || "syllabus"}.pdf`);
};
