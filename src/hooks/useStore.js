'use client'

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export const useStore = create((set, get) => ({
    user: null,
    notes: [],
    toast: null,

    showToast: (message, undoAction) => set({ toast: { message, undoAction, id: Date.now() } }),
    hideToast: () => set({ toast: null }),

    // Auth Initialization
    initAuth: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
            set({ user: { ...session.user, ...profile } })
            get().fetchNotes()
        }

        supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
                set({ user: { ...session.user, ...profile } })
                get().fetchNotes()
            } else {
                set({ user: null, notes: [] })
            }
        })
    },

    logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, notes: [] })
    },

    // Data Fetching
    fetchNotes: async () => {
        const { data, error } = await supabase
            .from('notes')
            .select(`*, profiles ( username, avatar_url )`)
            .order('created_at', { ascending: false })

        if (error) console.error('Error fetching notes:', error)
        else {
            const formattedNotes = data.map(n => ({
                id: n.id,
                title: n.title,
                content: n.content,
                color: n.color,
                image: n.image_url,
                isRead: n.is_read,
                date: new Date(n.created_at).toISOString().split('T')[0],
                author: n.profiles?.username || 'Unknown',
                avatar: n.profiles?.avatar_url,
                raw: n
            }))
            set({ notes: formattedNotes })
        }
    },

    addNote: async (note) => {
        let imageUrl = null
        if (note.image && note.image.startsWith('data:')) {
            const fileExt = 'png'
            const fileName = `${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(fileName, dataURItoBlob(note.image), { upsert: true })

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName)
                imageUrl = publicUrl
            }
        }

        const { data, error } = await supabase
            .from('notes')
            .insert({
                user_id: get().user.id,
                title: note.title,
                content: note.content,
                color: note.color,
                image_url: imageUrl,
                is_read: false
            })
            .select()

        if (!error) get().fetchNotes()
    },

    toggleRead: async (id) => {
        const currentNotes = get().notes
        const targetNote = currentNotes.find(n => n.id === id)
        const newStatus = !targetNote.isRead

        set({ notes: currentNotes.map(n => n.id === id ? { ...n, isRead: newStatus } : n) })

        const { error } = await supabase
            .from('notes')
            .update({ is_read: newStatus })
            .eq('id', id)

        if (error) {
            set({ notes: currentNotes })
            console.error('Error toggling read:', error)
        }
    },

    deleteNote: async (id) => {
        const currentNotes = get().notes
        set({ notes: currentNotes.filter(n => n.id !== id) })

        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', id)

        if (error) set({ notes: currentNotes })
    },

    restoreNote: async (note) => {
        get().addNote({
            title: note.title,
            content: note.content,
            color: note.color,
            image: note.image
        })
    }
}))

function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}
