import { CrudEntity, CrudEntityOptions } from '../crud-entity';
import { BaseModel } from '../models/state';
import { BaseHandler } from '../normalization/base';
import { CompoundHandler } from '../normalization/compound';
import { isClass } from '../utils';
import { RegisteredClass, HandlersRegistry, HandlersRegistryItem, HandlerType } from './action';

type ActionTypeRegistryItem = {
  type: string[];
  Reducer: HandlerType;
};

export function reduxStore<T extends { new (...args: any[]): RegisteredClass }>(EntityClass: T) {
  const ResultClass = class extends EntityClass implements RegisteredClass {
    types: { [key: string]: string } = {};

    reducer() {
      const { permit } = this.options;

      const list = this.registry!.reduce((acc: ActionTypeRegistryItem[], { key, Reducer: r }: any) => {
        if (permit && permit.indexOf(key) < 0) return acc;
        const type = this.name + '.' + key;

        this.types[key] = type;

        // function could be passed to resolve target reducer
        const Reducer = !r.name ? r(this.options) : r;

        const found = acc.find((i) => i.Reducer === Reducer);

        if (found) {
          found.type.push(type);
          return acc;
        }

        return [...acc, { type: [type], Reducer }];
      }, []).map(({ type, Reducer }: any) => {
        // TODO: make it better - check for BaseFetchActionReducer prototype
        if (isClass(Reducer)) {
          const r = new Reducer({ type, ...this.options.defaultOptions });
          return r.handle.bind(r);
        } else {
          return (state: any, action: any) => (type.indexOf(action.type) >= 0 ? Reducer(state, action) : null);
        }
      });

      const sideEffects = (this.options.sideEffects || []).map((Reducer: any) => {
        if (isClass(Reducer)) {
          const r = new Reducer({ ...this.options.defaultOptions });
          return r.handle.bind(r);
        } else {
          return Reducer;
        }
      });

      const r = new CompoundHandler({
        initialState: this.options.state,
        reducers: [...list, ...sideEffects],
      });

      const result = r.handle.bind(r);

      return this.configure ? this.configure(result) : result;
    }
  };

  return ResultClass;
}
