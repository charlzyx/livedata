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
