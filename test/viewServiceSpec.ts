import { UIRouter } from '../src/router';
import { ViewSyncListener, ViewTuple } from '../src/view';
import { tree2Array } from './_testUtils';
import { StateRegistry } from '../src/state/stateRegistry';
import { ViewService } from '../src/view/view';

let router: UIRouter = null;
let registry: StateRegistry = null;
let $view: ViewService = null;
const statetree = {
  A: {
    B: {
      C: {
        D: {},
      },
    },
  },
};

describe('View Service', () => {
  beforeEach(() => {
    router = new UIRouter();
    registry = router.stateRegistry;
    $view = router.viewService;
    tree2Array(statetree, true).forEach((state) => registry.register(state));
  });

  it('_pluginapi._registerView should track a ui-view', () => {
    expect($view._pluginapi._registeredUIViews().length).toBe(0);
    $view._pluginapi._registerView('core', null, '', () => {});
    expect($view._pluginapi._registeredUIViews().length).toBe(1);
  });

  it('_pluginapi.deregisterView should stop tracking a ui-view', () => {
    expect($view._pluginapi._registeredUIViews().length).toBe(0);
    const id = $view._pluginapi._registerView('core', null, '', () => {});
    expect($view._pluginapi._registeredUIViews().length).toBe(1);
    $view._pluginapi._deregisterView(id);
    expect($view._pluginapi._registeredUIViews().length).toBe(0);
  });

  describe('_pluginapi._registeredUIView', () => {
    it('should return a ui-view from an id', () => {
      expect($view._pluginapi._registeredUIViews()).toEqual([]);

      const id = $view._pluginapi._registerView('test', null, '$default', () => null);
      const registeredView = $view._pluginapi._registeredUIView(id);
      expect(registeredView).toBeDefined();
      expect(registeredView.name).toBe('$default');
      expect(registeredView.id).toBe(id);
    });
  });

  describe('onSync', () => {
    it('registers view sync listeners', () => {
      function listener(tuples: ViewTuple[]) {}
      const listeners: ViewSyncListener[] = ($view as any)._listeners;
      expect(listeners).not.toContain(listener);

      $view._pluginapi._onSync(listener);

      expect(listeners).toContain(listener);
    });

    it('returns a deregistration function', () => {
      function listener(tuples: ViewTuple[]) {}
      const listeners: ViewSyncListener[] = ($view as any)._listeners;
      const deregister = $view._pluginapi._onSync(listener);
      expect(listeners).toContain(listener);

      deregister();
      expect(listeners).not.toContain(listener);
    });

    it('calls the listener during sync()', () => {
      const listener = jasmine.createSpy('listener');
      $view._pluginapi._onSync(listener);
      $view.sync();
      expect(listener).toHaveBeenCalledWith([]);
    });

    it('ViewSyncListeners receive tuples for all registered uiviews', () => {
      const listener = jasmine.createSpy('listener');
      const id1 = $view._pluginapi._registerView('type1', null, 'foo', () => null);
      const id2 = $view._pluginapi._registerView('type2', null, 'bar', () => null);

      $view._pluginapi._onSync(listener);
      $view.sync();

      const argument = listener.calls.mostRecent().args[0];
      expect(argument).toEqual(jasmine.any(Array));
      expect(argument.length).toBe(2);
      const [tuple1, tuple2] = argument;
      expect(Object.keys(tuple1)).toEqual(['uiView', 'viewConfig']);
      expect(Object.keys(tuple2)).toEqual(['uiView', 'viewConfig']);
      expect(tuple1.uiView).toEqual(jasmine.objectContaining({ id: id1 }));
      expect(tuple2.uiView).toEqual(jasmine.objectContaining({ id: id2 }));
    });
  });
});
