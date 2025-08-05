export function extractSyllabusFields(text) {
    const fieldMap = {
        course_title: [/course title[:\-]?\s*(.+)/i],
        instructor_name: [/instructor[:\-]?\s*(.+)/i, /professor[:\-]?\s*(.+)/i],
        objectives: [/objectives[:\-]?\s*((.|\n)+?)(?=\n\w+[:\-])/i],
        schedule: [/schedule[:\-]?\s*((.|\n)+?)(?=\n\w+[:\-])/i],
        grading_policy: [/grading policy[:\-]?\s*((.|\n)+?)(?=\n\w+[:\-])/i],
        materials: [/materials[:\-]?\s*((.|\n)+?)(?=\n\w+[:\-])/i],
    };

    const result = {};

    for (const field in fieldMap) {
        const patterns = fieldMap[field];
        for (const regex of patterns) {
            const match = text.match(regex);
            if (match) {
                result[field] = match[1].trim();
                break;
            }
        }
    }

    return result;
}
