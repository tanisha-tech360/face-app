let hideDiaplayFrame = () =>{
    userIdInDisplayFrame = null

    displayFrame.style.display= null
    let child = displayFrame.children[0]
      document.getElementById('streams__container').appendChild(child)
      for (let i = 0; videoFrames.length > i; i++) {
        videoFrames[i].style.height = '300px'
        videoFrames[i].style.width = '300px'
      }


    }
    displayFrame.addEventListener('click', hideDiaplayFrame)