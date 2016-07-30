import React from 'react';
import {IndexRoute, Route} from 'react-router';
import {
    App,
    Home,
    Survey,
  } from 'containers';

export default () => {
  return (
    <Route path="/" component={App}>
      { /* Home (main) route */ }
      <IndexRoute component={Home}/>
      <Route path="survey" component={Survey}/>
    </Route>
  );
};
