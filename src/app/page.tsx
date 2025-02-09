import { Input } from "@/components/input"

export default function IndexPage() {
    return (
        <div className="h-screen flex flex-col justify-center items-center gap-5">
            <h1 className="text-2xl">
                Tell us about the video or paste its URL
            </h1>
            <Input />
        </div>
    )
}
