import { supabase } from "../utility/supabaseClient";

export async function updateSyllabusForm(id, sections, title) {
    const { data, error } = await supabase
        .from("syllabus_forms")
        .update({
            content: sections,
            title,
        })
        .eq("id", id)
        .select();

    return { data, error };
}

export async function fetchUniversityForCurrentUser() {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from("profiles")
        .select("university")
        .eq("user_id", user.id)
        .single();

    return {
        university: data?.university,
        error,
    };
}

export async function insertSyllabusForm(
    title,
    sections,
    university,
    syllabusType = "main",
    parentId = null
) {
    const { data, error } = await supabase
        .from("syllabus_forms")
        .insert([
            {
                title,
                content: sections,
                university,
                syllabus_type: syllabusType,
                parent_id: parentId,
            },
        ])
        .select();

    return { data, error };
}