
var postFormat = `<div id="div1" class="posts">
<div class="mb-3">
  <label for="tarea1" class="form-label" id="label1">ReplaceTimeStamp</label>
  <textarea class="form-control" id="tarea1" name="tarea1" rows="3"></textarea>
</div>
<div class="d-grid gap-2 d-sm-flex justify-content-sm-end">
  <button class="btn btn-primary" id="sav1" type="submit">Save</button>
  <button type="button" id="del1" class="btn btn-danger" >Delete</button>
</div>
</div>`;
function formHTMLContent1(postsMap) {
    var htmlContent = "";
    Object.keys(postsMap, (key) => {
        var retVal = postFormat.replaceAll('1',key);
        retVal = retVal.replace('ReplaceTimeStamp', postsMap[key]["dateVal"]);
        retVal = retVal.replace('rows="3"></textarea>','rows="3">'+postsMap[key]["postContent"]+'</textarea>'); 
        htmlContent= htmlContent+retVal;
    });
    return htmlContent;
}
function del(id) {
  console.log(document.getElementById('tarea'+id).value);
   document.getElementById('tarea'+id).value="";
}