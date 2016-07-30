import React from 'react';
import {IndexRoute, Route} from 'react-router';
import {
    App,
    Home,
    Survey,
    Report,
    Management
  } from 'containers';

export default () => {
  return (
    <Route path="/" component={App}>
      { /* Home (main) route */ }
      <IndexRoute component={Home}/>
      <Route path="survey" component={Survey}/>
      <Route path="report/:reportId" component={Report}/>
      <Route path="management" component={Management} />
    </Route>
  );
};
