"use server"

import { revalidatePath } from "next/cache"
import { env } from "@/env.mjs"
import { type MessageContent } from "@langchain/core/messages"
import { OpenAIEmbeddings } from "@langchain/openai"
import { eq } from "drizzle-orm"
import {
    RecursiveCharacterTextSplitter,
    TokenTextSplitter,
} from "langchain/text_splitter"
import { Innertube } from "youtubei.js/web"
import { z } from "zod"

import {
    summarizeTranscriptWithGemini,
    summarizeTranscriptWithGpt,
    summarizeTranscriptWithGroq,
} from "@/lib/core/summarize"
import { transcribeVideo } from "@/lib/core/transcribe"
import { db } from "@/lib/db"
import { embeddings, summaries, videos } from "@/lib/db/schema"
import { formSchema } from "@/components/form"
import { RegenerateFormSchema } from "@/components/regenerate-btn"

const openaiEmbed = new OpenAIEmbeddings({
    model: "text-embedding-ada-002",
})

export type FactCheckerResponse = {
    input: "string"
    isAccurate: "true" | "false"
    source: string
    text: string
}

export const embedTranscript = async ({
    videoId,
    transcript,
}: {
    videoId: string
    transcript: string
}) => {
    const textSplitter = new TokenTextSplitter({ chunkSize: 250 })

    try {
        const docs = await textSplitter.createDocuments([transcript])
        const transcripts = docs.map((d) => d.pageContent)

        const textEmbeddings = await openaiEmbed.embedDocuments([
            ...transcripts,
        ])
        if (!textEmbeddings) {
            throw new Error(
                "An unkown error occurred while generating the embedding."
            )
        }

        const rows = textEmbeddings.map((embedding, index) => ({
            videoid: videoId,
            embedding: embedding,
            content: transcripts[index],
        }))

        const res = await db.insert(embeddings).values(rows)

        if (!res) {
            throw new Error(
                "An unknown error occurred while uploading the embeddings."
            )
        }

        return true
    } catch (e) {
        console.error(e)
        return false
    }
}

export const summarizeTranscript = async ({
    transcript,
    model,
    videoTitle,
    videoAuthor,
}: {
    transcript: string
    model:
        | "gemini-1.5-flash"
        | "gpt-3.5-turbo"
        | "gpt-4o"
        | "llama3-70b-8192"
        | "mixtral-8x7b-32768"
    videoTitle: string
    videoAuthor: string
}) => {
    try {
        let summary: MessageContent | null = null
        if (model == "gpt-3.5-turbo" || model == "gpt-4o") {
            summary = await summarizeTranscriptWithGpt(
                transcript,
                model,
                videoTitle,
                videoAuthor
            )
        } else if (model == "gemini-1.5-flash") {
            summary = await summarizeTranscriptWithGemini(
                transcript,
                model,
                videoTitle,
                videoAuthor
            )
        } else {
            summary = await summarizeTranscriptWithGroq(
                transcript,
                model,
                videoTitle,
                videoAuthor
            )
        }

        return summary as string
    } catch (e) {
        console.error(e)
        return null
    }
}
export const updateSummary = async ({
    summary,
    videoId,
}: {
    summary: string
    videoId: string
}) => {
    try {
        await db
            .update(summaries)
            .set({ summary: summary })
            .where(eq(summaries.videoid, videoId))

        return true
    } catch (e) {
        console.error(e)
        return false
    } finally {
        revalidatePath(`/${videoId}`)
    }
}
export const uploadSummary = async ({
    summary,
    videoId,
}: {
    summary: string
    videoId: string
}) => {
    try {
        await db.insert(summaries).values({
            videoid: videoId,
            summary: summary as string,
        })

        return videoId
    } catch (e) {
        console.error(e)
        return null
    } finally {
        revalidatePath("/")
        revalidatePath("/summaries")
    }
}

export const uploadTranscript = async ({
    transcript,
    videoId,
    videoTitle,
}: {
    transcript: string
    videoId: string
    videoTitle: string
}) => {
    try {
        await db
            .insert(videos)
            .values({
                videoid: videoId,
                videotitle: videoTitle,
                transcript: transcript,
            })
            .onConflictDoNothing()

        return true
    } catch (e) {
        console.error(e)
        return false
    }
}

export const handleInitialFormSubmit = async (
    formData: z.infer<typeof formSchema>
) => {
    const youtube = await Innertube.create({
        location: "US",
        lang: "en",
        retrieve_player: false,
    })

    try {
        const videoId = new URL(formData.link).searchParams.get("v") as string
        const videoInfo = await youtube.getInfo(videoId, "IOS")

        const [existingVideo] = await db
            .select({
                summary: summaries.summary,
                transcript: videos.transcript,
            })
            .from(videos)
            .fullJoin(summaries, eq(videos.videoid, summaries.videoid))
            .where(eq(videos.videoid, videoId!))
            .limit(1)

        if (
            existingVideo &&
            existingVideo.summary &&
            existingVideo.transcript
        ) {
            return {
                videoId: videoId,
                videoTitle: videoInfo.basic_info.title,
                videoAuthor: videoInfo.basic_info.author,
                summary: existingVideo.summary,
                transcript: existingVideo.transcript,
            }
        } else if (
            existingVideo &&
            !existingVideo.summary &&
            existingVideo.transcript
        ) {
            return {
                videoId: videoId,
                videoTitle: videoInfo.basic_info.title,
                videoAuthor: videoInfo.basic_info.author,
                summary: null,
                transcript: existingVideo.transcript,
            }
        } else {
            const transcript = await transcribeVideo(formData.link)
            if (!transcript) {
                throw new Error("Couldn't transcribe the Video.")
            }

            return {
                videoId: videoId,
                videoTitle: videoInfo.basic_info.title,
                videoAuthor: videoInfo.basic_info.author,
                summary: null,
                transcript: transcript,
            }
        }
    } catch (e) {
        console.error(e)
        return null
    }
}

export const handleRegenerateSummary = async (
    formData: z.infer<typeof RegenerateFormSchema>
) => {
    const youtube = await Innertube.create({
        retrieve_player: false,
        location: "US",
        lang: "en",
    })

    try {
        const videoInfo = await youtube.getInfo(formData.videoid, "IOS")

        const [data] = await db
            .select({
                transcript: videos.transcript,
            })
            .from(videos)
            .where(eq(videos.videoid, formData.videoid))
            .limit(1)
        if (!data) {
            throw new Error("Couldn't find the transcription of this video.")
        }

        return {
            videoId: formData.videoid,
            transcript: data.transcript,
            videoTitle: videoInfo.basic_info.title,
            videoAuthor: videoInfo.basic_info.author,
        }
    } catch (e: any) {
        console.error(e)
        return false
    }
}
