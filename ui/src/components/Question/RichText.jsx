import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github.css';

export default function RichText({ children }) {
    return <div style={{overflowWrap:'anywhere',textAlign:'left'}}>
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[[rehypeKatex,{trust:false}],rehypeHighlight]}
            components={{pre: props => <pre {...props} style={{overflowX:'auto',padding:16,background:'#f8f9fa',borderRadius:8}} />}}>
            {String(children || '')}
        </ReactMarkdown>
    </div>;
}
