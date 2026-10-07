import { useState } from "react";
function NotesSection({notes,setNotes,saveNotes}){
  const [noteTitle,setNoteTitle]=useState("");
  const [noteContent,setNoteContent]=useState("");
  const addNote=()=>{
    if (!noteTitle.trim()||!noteContent.trim()){
      return;
    }
    const newNote={title:noteTitle, content:noteContent,};
    const updatedNotes=[...notes,newNote,];
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    setNoteTitle("");
    setNoteContent("");
  };
  const deleteNote=(index)=>{
    const updatedNotes=notes.filter((_,i)=>i!==index);
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
  };
  return(<div>
    <h2 stlye={{marginTop:0}}>
      Notes
    </h2>
    <input type="text"
    placeholder="Note title...."
    value={noteTitle}
    onChange={(e)=>setNoteTitle(e.target.value)}
    style={{width:"100%",
      boxSizing:"border-box",
      padding:"10px",
      marginBottom:"10px",
      borderRadius:"8px",
    }}/>
    <textarea value={noteContent}
    onChange={(e)=>setNoteContent(e.target.value)}
    placeholder="Write your note...."
    rows={5}
    style={{width:"100%",
      boxSizing:"border-box",
      padding:"10px",
      borderRadius:"8px",
      resize:"vertical",
    }}/>
    <button onClick={addNote}
    style={{marginTop:"12px",
      width:"100%",
      padding:"10px",
      background:"#A47148",
      cursor:"pointer",
    }}>
      Save Note
    </button>
    <hr style={{margin:"20px 0",}}/>
    <h3>
      Saved Notes
    </h3>
    {notes.length===0?(
      <p style={{opacity:0.7}}>
        No Notes Yet
      </p>):(notes.map((note,index)=>(
        <div key={index}
        style={{
          background:"#444",
          color:"white",
          padding:"12px",
          borderRadius:"10px",
          marginBottom:"10px",
        }}>
          <h4>
            {note.title}
          </h4>
          <p>
            {note.content}
          </p>
          <button onClick={()=>deleteNote(index)}>
            Delete
          </button>
        </div>
      ))
    )}
  </div>);
}
export default NotesSection;