import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

export async function extractTextFromFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const { value: text } = await mammoth.extractRawText({ arrayBuffer });
        return text;
    } else if (ext === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const data = await pdfParse(Buffer.from(arrayBuffer));
        return data.text;
    } else if (ext === 'txt') {
        return await file.text();
    } else {
        throw new Error('Unsupported file type');
    }
}
