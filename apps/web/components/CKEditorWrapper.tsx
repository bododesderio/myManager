'use client';

import { useRef } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading,
  Link,
  List,
  BlockQuote,
  Indent,
  Table,
  MediaEmbed,
  Essentials,
  Paragraph,
  Alignment,
  SourceEditing,
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';

interface CKEditorWrapperProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function CKEditorWrapper({
  value,
  onChange,
  placeholder = 'Start writing...',
  minHeight = 200,
}: CKEditorWrapperProps) {
  const editorRef = useRef<ClassicEditor | null>(null);

  return (
    <div className="ck-editor-wrapper" style={{ '--ck-min-height': `${minHeight}px` } as React.CSSProperties}>
      <CKEditor
        editor={ClassicEditor}
        data={value}
        config={{
          plugins: [
            Essentials,
            Paragraph,
            Bold,
            Italic,
            Underline,
            Strikethrough,
            Heading,
            Link,
            List,
            BlockQuote,
            Indent,
            Table,
            MediaEmbed,
            Alignment,
            SourceEditing,
          ],
          toolbar: {
            items: [
              'heading',
              '|',
              'bold',
              'italic',
              'underline',
              'strikethrough',
              '|',
              'alignment',
              '|',
              'bulletedList',
              'numberedList',
              '|',
              'blockQuote',
              'insertTable',
              'link',
              'mediaEmbed',
              '|',
              'indent',
              'outdent',
              '|',
              'sourceEditing',
            ],
          },
          placeholder,
        }}
        onReady={(editor) => {
          editorRef.current = editor;
          const editableElement = editor.ui.view.editable.element;
          if (editableElement) {
            editableElement.style.minHeight = `${minHeight}px`;
          }
        }}
        onChange={(_event, editor) => {
          const data = editor.getData();
          onChange(data);
        }}
      />
    </div>
  );
}
