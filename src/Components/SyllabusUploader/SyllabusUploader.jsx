import React, { useState } from 'react';
import { extractTextFromFile } from '../utils/extractTextFromFile';
import { extractSyllabusFields } from '../utils/extractSyllabusFields';
import { parseTableFromText } from '../utils/parseTableFromText';

export default function SyllabusUploader() {
    const [formData, setFormData] = useState({});
    const [tableData, setTableData] = useState([]);

    async function handleFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await extractTextFromFile(file);

            // Extract fields
            const fields = extractSyllabusFields(text);
            setFormData(fields);

            // Extract tables heuristically
            const tables = parseTableFromText(text);
            setTableData(tables);

            // TODO: Map tables into your predefined tables UI using tags
        } catch (err) {
            console.error(err);
            alert('Failed to parse file.');
        }
    }

    return (
        <div>
            <input type="file" accept=".docx,.pdf,.txt" onChange={handleFileChange} />

            <h2>Extracted Fields</h2>
            <pre>{JSON.stringify(formData, null, 2)}</pre>

            <h2>Extracted Table Preview</h2>
            <table border="1">
                <tbody>
                    {tableData.map((row, i) => (
                        <tr key={i}>
                            {row.map((cell, j) => (
                                <td key={j}>{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
