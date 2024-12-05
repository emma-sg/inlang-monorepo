import { useAtom } from "jotai";
import { Textarea } from "./ui/textarea.tsx";
import { Form, FormControl, FormField, FormItem } from "./ui/form.tsx";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button.tsx";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar.tsx";
import { activeAccountAtom } from "@/state.ts";
import IconArrow from "./icons/IconArrow.tsx";

const ChatInput = () => {
  const [activeAccount] = useAtom(activeAccountAtom);

  const form = useForm({
    defaultValues: {
      comment: "",
    },
  });
  const { handleSubmit, watch, formState: { isValid } } = form;
  const commentValue = watch("comment");

  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    event.target.style.height = "auto";
    event.target.style.height = `${event.target.scrollHeight}px`;
  };

  const handleAddComment = (data: { comment: string }) => {
    // Handle the comment submission logic here
    console.log("Comment submitted:", data.comment);
    form.reset();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      handleSubmit(handleAddComment)();
    }
  };

  return (
    <div className="flex items-end justify-between gap-1.5 px-2.5 py-5 border-t border-slate-100">
      <Avatar className="w-8 h-8 mb-1 cursor-pointer hover:opacity-90 transition-opacity">
        <AvatarImage src="#" alt="#" />
        <AvatarFallback className="bg-[#fff] text-[#141A21] border border-[#DBDFE7]">
          {activeAccount?.name ? activeAccount.name.substring(0, 2).toUpperCase() : "XX"}
        </AvatarFallback>
      </Avatar>
      <Form {...form}>
        <form
          onSubmit={handleSubmit(handleAddComment)}
          className="flex flex-1 items-center ring-1 ring-slate-100 rounded-md bg-white pl-3 pr-1 py-0.5"
        >
          <FormField
            control={form.control}
            name="comment"
            rules={{ required: "Comment content is required" }}
            render={({ field }) => (
              < FormItem className="flex-1">
                <FormControl>
                  <Textarea
                    {...field}
                    rows={1}
                    placeholder="Add a comment ..."
                    className="flex-1 border-none resize-none overflow-hidden shadow-none px-0 pt-2 focus-visible:ring-0"
                    onInput={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    style={{ minHeight: "24px", fontSize: "1rem" }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={!isValid || commentValue === ""}
            size="sm"
            variant="ghost"
            className="px-1 mt-auto mb-1"
          >
            <IconArrow />
          </Button>
        </form>
      </Form>
    </div >
  );
};

export default ChatInput;