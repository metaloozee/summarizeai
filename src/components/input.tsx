"use client"

import {
    ChangeEvent,
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react"
import { usePathname } from "next/navigation"
import {
    CaretSortIcon,
    CheckIcon,
    ChevronDownIcon,
} from "@radix-ui/react-icons"
import { Attachment, ChatRequestOptions, CreateMessage, Message } from "ai"
import {
    Check,
    ChevronsUpDown,
    CornerDownLeftIcon,
    Globe2Icon,
    PaperclipIcon,
    SendHorizonalIcon,
    StopCircleIcon,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "./ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

const geminiModels = [
    { label: "Gemini 2.0 Flash", value: "gemini-2.0-flash" },
    {
        label: "Gemini 2.0 Flash-Lite Preview 02-05",
        value: "gemini-2.0-flash-lite-preview-02-05",
    },
]

export const Input = ({}: {}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const input = "hell"
    const isLoading = false
    const [open, setOpen] = useState(false)
    const [selectedModel, setSelectedModel] = useState<string>()

    return (
        <div
            className={cn(
                "w-full max-w-3xl flex flex-col border-2 bg-zinc-900/50 rounded-lg p-4 focus-within:border-zinc-700/70 hover:border-zinc-700/70 transition-all duration-200"
            )}
        >
            <Textarea
                autoFocus
                ref={textareaRef}
                placeholder="NGGYU by Rick Astley"
                className="flex-grow ring-0 border-0 outline-none resize-none focus-visible:ring-0 focus-visible:outline-none"
                rows={3}
            />

            <AnimatePresence>
                {(input || isLoading) && (
                    <motion.div
                        className="flex justify-between w-full"
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className="gap-5 justify-between"
                                >
                                    {selectedModel
                                        ? geminiModels.find(
                                              (model) =>
                                                  model.value === selectedModel
                                          )?.label
                                        : "Select model..."}
                                    <ChevronDownIcon className="opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0">
                                <Command>
                                    <CommandInput
                                        placeholder="Search framework..."
                                        className="h-9"
                                    />
                                    <CommandList>
                                        <CommandEmpty>
                                            No models found.
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {geminiModels.map((models) => (
                                                <CommandItem
                                                    key={models.value}
                                                    value={models.value}
                                                    onSelect={(
                                                        currentValue
                                                    ) => {
                                                        setSelectedModel(
                                                            currentValue ===
                                                                selectedModel
                                                                ? ""
                                                                : currentValue
                                                        )
                                                        setOpen(false)
                                                    }}
                                                >
                                                    {models.label}
                                                    <Check
                                                        className={cn(
                                                            "ml-auto",
                                                            selectedModel ===
                                                                models.value
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {isLoading ? (
                            <Button
                                size={"icon"}
                                variant={"destructive"}
                                onClick={stop}
                                aria-label="Send message"
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    transition={{
                                        delay: 0.1,
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 10,
                                    }}
                                >
                                    <StopCircleIcon />
                                </motion.div>
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                // variant={"secondary"}
                                disabled={!input}
                                aria-label="Submit"
                                onClick={(event) => {
                                    event.preventDefault()
                                }}
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{
                                        delay: 0.1,
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 10,
                                    }}
                                >
                                    <SendHorizonalIcon className="size-4" />
                                </motion.div>
                            </Button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
