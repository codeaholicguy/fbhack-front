import React from 'react';
import _ from 'lodash';

export default class Question extends React.Component {
  constructor(props) {
    super(props);
    const {question} = props;
    if (question) {
      this.state = {
        readonly: true,
        title: question.title,
        type: question.type,
        editingOption: {
          title: ''
        },
        options: question.options
      };
    } else {
      this.state = {
        editing: false,
        title: '',
        type: 'text',
        editingOption: {
          title: ''
        },
        options: []
      };
    }
  }
  onAddOption = () => {
    if (_.isEmpty(this.state.editingOption.title)) {
      return;
    }
    this.setState({
      options: [...this.state.options, {title: this.state.editingOption.title}],
      editingOption: {
        title: ''
      }
    });
  }
  render() {
    return (
      <div style={{
        display: 'flex',
        backgroundColor: 'white',
        padding: 10,
        marginBottom: 10,
        flexDirection: 'column',
        maxWidth: 400
      }}>
        <div style={{display: 'flex'}}>
          <div style={{flex: 1, marginRight: 5}}>
            {this.state.readonly ? this.state.title : <input type="text" className="form-control" value={this.state.title} onChange = {(event) => this.setState({title: event.target.value})} placeholder="Title"/> }
          </div>
          <div>
            {
              this.state.readonly ?
              this.state.type :
                <select className="form-control" value={this.state.type} onChange={(event) => this.setState({type: event.target.value})}>
                  <option value="text">Free Text</option>
                  <option value="multiple">Multiple Choice</option>
                </select>
            }
          </div>
        </div>
        {
          this.state.type === 'multiple' ?
            <div style={{display: 'flex', flexDirection: 'column', marginTop: 10, marginBottom: 10, marginLeft: 5}}>
              {this.state.options.map((option) =>
                <div style={{display: 'flex', alignItems: 'center', marginBottom: 10}}>
                  <div style={{flex: 1}}>{option.title}</div>
                  {this.props.onAddBranch ?
                    <button type="submit" className="btn btn-default" onClick={() => this.props.onAddBranch({
                      title: `${this.state.title}.${option.title}`,
                      questions: []
                    })}>Create branch</button>
                    : null
                  }

                </div>
              )}
              {this.state.readonly ? null :
                <div style={{display: 'flex'}}>
                  <div style={{flex: 1, marginRight: 5}}>
                    <label className="sr-only" htmlFor="questionTitle">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={this.state.editingOption.title}
                      onKeyDown = {(event) => event.keyCode === 13 && this.onAddOption()}
                      onChange = {(event) => this.setState({editingOption: {title: event.target.value}})} placeholder="Title"/>
                  </div>
                  <button type="button" className="btn btn-default" onClick={this.onAddOption}>Add option</button>
                </div>
              }
            </div> : null
        }
        {this.state.readonly ? null :
          <button
            type="submit"
            style={{marginTop: 10}}
            className="btn btn-default"
            onClick={() => {
              this.props.onAddQuestion(this.state);
              this.setState({
                title: '',
                type: 'text',
                editingOption: {
                  title: ''
                },
                options: []
              });
            }}
          >Add</button>
        }
      </div>
    );
  }
}
