import React from "react"

/* 
 * Component which serves the purpose of a "root route component". 
 */
class Page extends React.Component {
  
  /**
   * Here, we use a component prop to render 
   * a component, as specified in route configuration
   */
  render() {
    document.title = this.props.title
    return this.props.component
  }
}

export default Page