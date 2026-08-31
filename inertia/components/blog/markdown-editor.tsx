import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  linkPlugin,
  linkDialogPlugin,
  UndoRedo,
  ButtonWithTooltip,
  BoldItalicUnderlineToggles,
  ListsToggle,
  CreateLink,
  InsertThematicBreak,
  Separator,
  applyBlockType$,
  usePublisher,
  type MDXEditorMethods,
} from '@mdxeditor/editor'

import '@mdxeditor/editor/style.css'
import * as React from 'react'

import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'

type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'quote'

const BLOCK_BUTTONS: { value: BlockType; label: string; title: string }[] = [
  { value: 'paragraph', label: 'P', title: 'Paragraph' },
  { value: 'h1', label: 'H1', title: 'Heading 1' },
  { value: 'h2', label: 'H2', title: 'Heading 2' },
  { value: 'h3', label: 'H3', title: 'Heading 3' },
  { value: 'h4', label: 'H4', title: 'Heading 4' },
  { value: 'h5', label: 'H5', title: 'Heading 5' },
  { value: 'h6', label: 'H6', title: 'Heading 6' },
  { value: 'quote', label: '❝', title: 'Quote' },
]

/** Toolbar block-type buttons that apply heading/quote/paragraph via applyBlockType$ */
function BlockTypeButtons() {
  const applyBlock = usePublisher(applyBlockType$)
  return (
    <>
      {BLOCK_BUTTONS.map(({ value, label, title }) => (
        <ButtonWithTooltip
          key={value}
          title={title}
          onPointerDown={(e) => {
            e.preventDefault()
            applyBlock(value)
          }}>
          {label}
        </ButtonWithTooltip>
      ))}
    </>
  )
}

export interface MarkdownEditorProps {
  value: string
  onChange: (markdown: string) => void
  className?: string
  /** Optional: when set, editor content is synced when value changes (e.g. post.id for edit page) */
  editorKey?: string
}

export function MarkdownEditor({ value, onChange, className, editorKey }: MarkdownEditorProps) {
  const ref = React.useRef<MDXEditorMethods>(null)
  const [mounted, setMounted] = React.useState(false)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted || !ref.current || editorKey === undefined) return
    ref.current.setMarkdown(value)
  }, [mounted, editorKey])

  if (!mounted) {
    return (
      <div
        className={cn(
          'flex min-h-[280px] items-center justify-center rounded-lg border border-input bg-muted/30 text-muted-foreground',
          className,
        )}>
        <span className='text-sm'>Loading editor…</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-input bg-background markdown-editor-wrapper max-h-[420px] flex flex-col overflow-visible',
        isDark && 'dark-theme',
        className,
      )}>
      <style>{`
        .markdown-editor-wrapper ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5em 0; }
        .markdown-editor-wrapper ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5em 0; }
        .markdown-editor-wrapper li { margin: 0.25em 0; display: list-item; }
        .markdown-editor-wrapper li ul,
        .markdown-editor-wrapper li ol { margin: 0.25em 0; }
        .markdown-editor-wrapper .mdxeditor-root { max-height: 100%; display: flex; flex-direction: column; min-height: 0; overflow: visible; }
        .markdown-editor-wrapper .mdxeditor-content-scroll { overflow-y: auto !important; max-height: 360px; min-height: 240px; }
        .markdown-editor-wrapper [data-radix-popper-content-wrapper],
        .markdown-editor-wrapper [role="dialog"] { z-index: 100; }
        body [data-radix-popper-content-wrapper] { z-index: 9999; }
        body [role="dialog"] { z-index: 9999; }
        .markdown-editor-wrapper.dark-theme .mdxeditor-root-contenteditable,
        .markdown-editor-wrapper.dark-theme .mdxeditor-content-scroll { color: var(--foreground); }
        .markdown-editor-wrapper.dark-theme .mdxeditor-root-contenteditable p,
        .markdown-editor-wrapper.dark-theme .mdxeditor-root-contenteditable li,
        .markdown-editor-wrapper.dark-theme .mdxeditor-root-contenteditable h1,
        .markdown-editor-wrapper.dark-theme .mdxeditor-root-contenteditable h2,
        .markdown-editor-wrapper.dark-theme .mdxeditor-root-contenteditable h3,
        .markdown-editor-wrapper.dark-theme .mdxeditor-root-contenteditable h4,
        .markdown-editor-wrapper.dark-theme .mdxeditor-root-contenteditable h5,
        .markdown-editor-wrapper.dark-theme .mdxeditor-root-contenteditable h6,
        .markdown-editor-wrapper.dark-theme .mdxeditor-root-contenteditable blockquote { color: var(--foreground); }
      `}</style>
      <MDXEditor
        ref={ref}
        markdown={value}
        onChange={onChange}
        contentEditableClassName='mdxeditor-content-scroll'
        plugins={[
          linkPlugin(),
          linkDialogPlugin(),
          headingsPlugin(),
          quotePlugin(),
          listsPlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <Separator />
                <BlockTypeButtons />
                <Separator />
                <BoldItalicUnderlineToggles />
                <CreateLink />
                <ListsToggle />
                <InsertThematicBreak />
              </>
            ),
            toolbarClassName:
              'border-b border-border bg-muted/30 px-2 py-1 gap-1 flex-wrap shrink-0',
          }),
        ]}
        className={cn('min-h-0 flex-1 flex flex-col prose prose-sm dark:prose-invert max-w-none')}
      />
    </div>
  )
}
