# todolist

```tsx
import React, { useEffect, useRef } from 'react';
import { toJS } from '@formily/reactive';
import { set, useLiveData } from './livedata';

const TodoList = () => {
  // const [todos, setTodos] = useState<{ title: string; done: boolean }[]>([]);
  const $todos = useLiveData<{ title: string; done: boolean }[]>([]);

  useEffect(() => {
    // 引用地址没有变, 后续变更不会触发
    console.log('only work at init', $todos[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [$todos[0]]);

  useEffect(() => {
    // toJS 会 clone , 任何变化都会触发
    console.log('always work', $todos[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toJS($todos)[0]]);

  useEffect(() => {
    // 精确变更, 会触发
    console.log('todos[0].title changes ~> ', $todos[0]?.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [$todos[0]?.title]);

  const wt = `${$todos.filter((x) => x.done).length}/${$todos.length}`;

  return (
    <div>
      <h1>土豆丝 {wt}</h1>
      <div>
        {$todos.map((item, idx) => {
          return (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8 }} key={idx}>
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => {
                  // setTodos((list) => {
                  //   list[idx] = {
                  //     ...list[idx],
                  //     done: !list[idx].done,
                  //   };
                  //   return [...list];
                  // });
                  item.done = !item.done;
                }}
              />
              <input
                value={item.title}
                type="text"
                onInput={(e) => {
                  // setTodos((list) => {
                  //   list[idx] = {
                  //     ...list[idx],
                  //     title: (e.target as any).value,
                  //   };
                  //   return [...list];
                  // });
                  item.title = (e.target as any).value;
                }}
              />
              <div
                onClick={() => {
                  $todos.splice(idx, 1);
                  // setTodos((list) => {
                  //   return list.splice(idx, 1);
                  // });
                }}
              >
                丢到垃圾桶里面
              </div>
            </div>
          );
        })}
      </div>
      <div
        onClick={() => {
          // setTodos((list) => {
          //   list.push({ title: '', done: false });
          //   return [...list];
          // });
          $todos.push({ title: '', done: false });
        }}
      >
        切一片土豆丝
      </div>
    </div>
  );
};

export default TodoList;

```

## livedata.ts

```ts
import { Tracker, observable, observe, toJS } from '@formily/reactive';
import { get as lodashGet, set as lodashSet } from 'lodash';
import { useEffect, useReducer, useRef, useState } from 'react';

const _ = { get: lodashGet, set: lodashSet };

const factory = {
  accId: 1,
  cache: {} as any,
  make: <S extends Record<string, any> | Array<any>>(path?: string, init?: S | (() => S)) => {
    const parts = path?.split('.') || ['ROOT'];
    const [namespace, others] = parts;
    const cached = factory.cache[namespace];
    if (cached) return cached;

    const initData = typeof init === 'function' ? init() : init;

    const ob = initData
      ? others
        ? observable(_.set({}, others, initData))
        : observable(initData)
      : others
      ? observable(_.set({}, others, 'TO_BE_CONTINUTED'))
      : observable({});

    /** 直接 undfined 有问题 */
    if (others && !initData) {
      _.set(ob, others, undefined);
    }

    factory.cache[namespace] = ob;

    if (namespace !== 'ROOT') {
      factory.cache.ROOT = factory.cache.ROOT || observable({ ROOT: {} });
      factory.cache.ROOT[namespace] = ob;
    }

    return ob;
  },
};

const useId = () => {
  const id = useRef(factory.accId++);
  return id.current.toString();
};

// const opWrite = { set: true, delete: true, clear: true, add: true } as Record<string, boolean>;
export function useLiveData<S extends Record<string, any> | Array<any> = Record<string, any>>(
  path?: string,
  init?: S | (() => S),
): S & { raw: S };
export function useLiveData<S extends Record<string, any> | Array<any> = Record<string, any>>(
  init?: S | (() => S),
): S & { raw: S };
export function useLiveData<S extends Record<string, any> | Array<any> = Record<string, any>>(
  path?: string,
  initial?: S | (() => S),
): S & { raw: S } {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const id = useId();
  const init = typeof path === 'string' ? initial : path;

  const [namespace] = typeof path === 'string' ? path?.split('.') : [id];

  const [data] = useState(factory.make(typeof path === 'string' ? path : id, init));

  const [deps, setDeps] = useState<Record<string, true>>({ [namespace]: true });

  /** 收集依赖 */
  useEffect(() => {
    const dispose = observe(data, (change) => {
      const chain = change.path.join('.');
      // 不是当前 namespace
      const exist = deps[chain];
      if (!exist) {
        setDeps((old) => {
          return {
            ...old,
            [chain.replace(`${namespace}.`, '')]: true,
          };
        });
      }
    });
    return dispose;
  }, [data, deps, id, namespace, path]);

  useEffect(() => {
    const walk = () => {
      if (Object.keys(deps).length === 0) {
        // 利用 toJS 的遍历, 访问到所有用到的节点
        toJS(data);
      } else {
        Object.keys(deps).forEach((chain) => _.get(data, chain));
      }
      forceUpdate();
    };
    const tracker = new Tracker(() => {
      tracker.track(walk);
    });
    tracker.track(walk);

    return () => {
      tracker.dispose();
    };
  }, [data, deps]);

  return data;
}
export const set = (namespace: string, producer: (draft: any) => void, init?: any) => {
  const ob = factory.make(namespace, init);
  producer(ob);
};

```
