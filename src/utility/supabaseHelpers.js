import { supabase } from "../utility/supabaseClient";

export async function updateSyllabusForm(
    id,
    sections,
    title,
    syllabusType = "main",
    overrides = {}
) {
    const updateData = {
        title,
    };

    if (syllabusType === "main") {
        // Main syllabuses own the actual structure/content
        updateData.content = sections;
    } else {
        // Instances store their custom changes separately
        updateData.overrides = overrides;
    }

    const { data, error } = await supabase
        .from("syllabus_forms")
        .update(updateData)
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
    parentId = null,
    overrides = {}
) {
    const insertData = {
        title,
        university,
        syllabus_type: syllabusType,
        parent_id: parentId,
        overrides,
    };

    if (syllabusType === "main") {
        insertData.content = sections;
    } else {
        // Instance doesn't need to duplicate the main content
        insertData.content = [];
    }

    const { data, error } = await supabase
        .from("syllabus_forms")
        .insert([insertData])
        .select();

    return { data, error };
}