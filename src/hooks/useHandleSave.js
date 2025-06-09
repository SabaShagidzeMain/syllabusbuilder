import { supabase } from "../utility/supabaseClient";

export const useHandleSave = (
    mode,
    selectedSyllabus,
    userId,
    university,
    setProfForms,
    closeModal
) => {
    return async (editedContent) => {
        if (!selectedSyllabus || !userId) {
            console.error("Missing required info");
            return;
        }

        const formPayload = {
            title: selectedSyllabus.title,
            content: editedContent,
            origin_id: selectedSyllabus.origin_id || selectedSyllabus.id,
            user_id: userId,
            university,
        };

        try {
            if (mode === "create") {
                const { error } = await supabase.from("prof_forms").insert([formPayload]);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("prof_forms")
                    .update(formPayload)
                    .eq("id", selectedSyllabus.id);
                if (error) throw error;
            }

            // Refresh profForms list
            const { data: updatedForms, error: fetchError } = await supabase
                .from("prof_forms")
                .select("*")
                .eq("user_id", userId);

            if (fetchError) {
                console.error("Error fetching updated profForms:", fetchError.message);
            } else {
                setProfForms(updatedForms);
            }

            closeModal();
        } catch (e) {
            console.error("Save error:", e.message);
        }
    };
};
