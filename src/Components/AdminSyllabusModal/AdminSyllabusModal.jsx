import React, { useEffect, useState } from "react";
import { supabase } from "../../utility/supabaseClient";
import "./AdminSyllabusModal.css"

export default function AdminSyllabusModal({ isOpen, onClose, onEdit }) {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        const fetchForms = async () => {
            const { data, error } = await supabase
                .from("prof_forms")
                .select("id, title, created_at, user_id, content")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching forms:", error.message);
            } else {
                setForms(data);
            }

            setLoading(false);
        };

        fetchForms();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Professor Syllabuses</h2>
                <button onClick={onClose} className="close-btn">✕</button>

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <table className="syllabus-table">
                        <thead>
                            <tr className="asm-tr">
                                <th>Title</th>
                                <th>User ID</th>
                                <th>Created At</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {forms.map((form) => (
                                <tr key={form.id} className="asm-tr">
                                    <td>{form.title}</td>
                                    <td>{form.user_id || "Unknown"}</td>
                                    <td>{new Date(form.created_at).toLocaleString()}</td>
                                    <td>
                                        <button onClick={() => onEdit(form)} className="blue-button">
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
