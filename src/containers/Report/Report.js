import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import Helmet from 'react-helmet';
import {initialize} from 'redux-form';
import Data from './data';
import {PieChart} from 'react-d3-components';

@connect(
  (state, props) => ({reportId: props.routeParams.reportId}),
  {initialize})
export default class Report extends Component {
  static propTypes = {
    data: PropTypes.object,
    currentSurvey: PropTypes.object
  }

  constructor() {
    super();
    this.state = {
      data: Data,
      currentSurvey: Data.surveys.length ? Data.surveys[0] : undefined,
      isShowSurveys: true
    };
  }

  getIconName = (filter) => {
    switch (filter.type) {
      case 'gender':
        return 'fa-' + filter.value;

      case 'age':
        return 'fa-line-chart';

      default:
        return '';
    }
  }

  showSurvey = (id) => {
    const result = this.state.data.surveys.find((survey) => {
      return survey.id === id;
    });

    if (result) {
      this.setState({
        currentSurvey: result
      });
    }
  }

  showSurveysComponent = (isShowSurveys) => {
    this.setState({
      isShowSurveys: isShowSurveys
    });
  }

  getQuestionContent = (question) => {
    switch (question.type) {
      case 'free_answer':
        return (
          <ul>
            {question.answers.map((answer) => {
              return (
                <li>
                  <img src={answer.avatar} />
                  <p>{answer.value}</p>
                </li>
              );
            })}
          </ul>
        );
      default:
        return (
          <PieChart
            data={{
              label: '',
              values: question.answers
            }}
            width={500}
            height={500}
            margin={{top: 10, bottom: 10, left: 100, right: 100}}
            sort={null}
            />
        );
    }
  }

  render() {
    const data = this.state.data;
    const currentSurvey = this.state.currentSurvey;
    const isShowSurveys = this.state.isShowSurveys;

    return (
      <div className="container">
        <h1 className="row">
          <span className="col-xs-4">{ data.name }</span>
          <div className="btn-group btn-group-lg col-xs-8" role="group" aria-label="Menu">
            <button type="button" className={"btn btn-warning " + (isShowSurveys ? 'active' : '')} onClick={() => this.showSurveysComponent(true)}>Surveys</button>
            <button type="button" className={"btn btn-warning " + (!isShowSurveys ? 'active' : '')} onClick={() => this.showSurveysComponent(false)}>Comparison</button>
          </div>
        </h1>
        <Helmet title="Report"/>

        {isShowSurveys &&
          <div className="row survey-list">
            <section className="ibox survey-list col-xs-4">
              <ul className="list-group list-group">
                {data.surveys.map((survey) => {
                  return (
                    <li className={'list-group-item ' + (currentSurvey && currentSurvey.id === survey.id ? 'active' : '' ) } onClick={() => this.showSurvey(survey.id)}>
                      <p>{survey.title}</p>
                    </li>
                  );
                })}
              </ul>
            </section>

            <div className="survey-container col-xs-8">
              {currentSurvey &&
                <section className="ibox survey-details">
                  <div className="survey-content survey-report row">
                    <dl>
                      <dt><i className="fa fa-users"></i></dt>
                      <dd>{currentSurvey.responseCount} responses</dd>
                    </dl>
                    {currentSurvey.filters.map((filter) => {
                      return (
                        <dl>
                          <dt><i className={'fa ' + this.getIconName(filter)}></i></dt>
                          <dd>{filter.value}</dd>
                        </dl>
                      );
                    })}
                  </div>

                  {currentSurvey.questions.map((question) => {
                    return (
                      <div className={ "survey-content survey-question " + question.type }>
                        <h2>{question.title}</h2>
                        <div className="survey-answer">
                          {this.getQuestionContent(question)}
                        </div>
                      </div>
                    );
                  })}
                </section>
              }
            </div>
          </div>
        }

        {!isShowSurveys &&
          <div className="row comparison-page">
            Comparison
          </div>
        }
      </div>
    );
  }
}
