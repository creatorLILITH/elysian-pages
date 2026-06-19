function PDFViewer({ fileUrl }) {
  return (
    <iframe
      src={fileUrl}
      title="PDF Viewer"
      width="100%"
      height="700px"
      style={{ border: "none" }}
    />
  );
}

export default PDFViewer;