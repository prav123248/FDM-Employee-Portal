import React from 'react'
import "../styles/uploadForm.css"

const UploadDocument = () => {
  return (
    <>
      <h1>Document Upload</h1>
      <form className={"uploadDocumentsForm"}>
        <div class="form-outline mb-4">
          <label class="form-label" for="Title">Document title (if no title is entered, the original file name will be used):</label>
          <input class="form-control" type="text" id="Title"></input>
        </div>

        <div class = "form-outline mb-4">
          <label class = "form-label" for = "File">File:</label>
          <br />
          <input class ="form-label" for = "File" type = "file" required />
        </div>

        <div class = "row">
          <div class = "col">
              <button type="submit" class="btn btn-success btn-block mb-4">Submit Form</button>
          </div>
          <div class = "col">
              <button type="reset" class="btn btn-danger btn-block mb-4">Reset</button>
          </div>
        </div>

      </form>
    </>
  )
}

export default UploadDocument