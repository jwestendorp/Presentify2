import React from 'react';
import { isEqual } from 'lodash';
import JSON6 from 'json-6';

import { DocumentEvent, Draggable } from './Elements';

import { component_map } from './Components';

let Absolute = ({ left, right, top, bottom, children, style }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left,
        right,
        top,
        bottom,
        ...style,
      }}
      children={children}
    />
  );
};

let DraggingCircle = () => {
  return (
    <div
      style={{
        cursor: 'pointer',
        margin: -4,
        border: 'solid 2px black',
        backgroundColor: 'white',
        height: 8,
        width: 8,
        borderRadius: '50%',
      }}
    />
  );
};

let vector = {
  rotate: ([x, y], rotation) => {
    var cos = Math.cos(rotation);
    var sin = Math.sin(rotation);
    return [x * cos - y * sin, x * sin + y * cos];
  },

  to_rotation: ([x, y]) => Math.atan2(y, x),

  add: ([x1, y1], [x2, y2]) => {
    return [x1 + x2, y1 + y2];
  },
};

// let DEFAULT_MOVEMENT_VECTORS = {
//   position: { x: 0, y: 0 },
//   size: { x: 0, y: 0 },
//   rotation:
// }

class CanvasItem extends React.Component {
  state = {
    movement_state: null,
  };

  render() {
    let { movement_state } = this.state;
    let { item, selected, onSelect, onChange, children } = this.props;

    let act_like_selected = selected || movement_state != null;

    let with_defaults = {
      y: 0,
      x: 0,
      width: 0,
      height: 0,
      rotation: item.rotation,
      ...movement_state,
    };

    let current_item = {
      y: item.y + with_defaults.y,
      x: item.x + with_defaults.x,
      width: item.width + with_defaults.width,
      height: item.height + with_defaults.height,
      rotation: with_defaults.rotation,
    };

    // Positions:
    // -1,-1 -----  1,-1
    //   |           |
    // -1, 1 -----  1, 1
    // let width_height_movement = (direction, movement_state) => {
    //   let [x, y] = vector.rotate(
    //     [movement_state.x, movement_state.y],
    //     -item.rotation
    //   );
    //   let with_rotation = vector.rotate([x / 2, y / 2], item.rotation);
    //   return {
    //     width: direction[0] * x,
    //     x: with_rotation[0],
    //     height: direction[1] * y,
    //     y: with_rotation[1],
    //   };
    // }; 

    let width_height_movement = (direction, movement_state) => {
      let [x, y] = vector.rotate(
        [movement_state.x, movement_state.y],
        -item.rotation
      );
      let with_rotation = vector.rotate([x / 2, y / 2], item.rotation);

      return {
        width: direction[0] * x,
        x: with_rotation[0],
        height: direction[1] * y,
        y: with_rotation[1],
      };
    };

    return (
      <Absolute top={current_item.y} left={current_item.x}>
        <div
          onMouseDown={() => {
            onSelect();
          }}
          style={{
            height: current_item.height,
            width: current_item.width,
            position: 'relative',
            transformOrigin: 'center',
            transform: `translateX(-50%) translateY(-50%) rotate(${
              current_item.rotation
            }rad)`,
          }}
        >
          {act_like_selected && (
            <Absolute
              top={-1}
              left={-1}
              right={-1}
              bottom={-1}
              style={{
                border: act_like_selected
                  ? '1px black dotted'
                  : `1px transparent solid`,
              }}
            >
              <Draggable
                onMove={(movement_state) => {
                  let current_to_start_vector = [
                    -movement_state.x,
                    -movement_state.y,
                  ];
                  let start_to_center_vector = vector.rotate(
                    [0, item.height / 2 + 50],
                    item.rotation
                  );

                  let straight_angle = 1 / 2 * Math.PI;
                  this.setState({
                    movement_state: {
                      rotation:
                        vector.to_rotation(
                          vector.add(
                            current_to_start_vector,
                            start_to_center_vector
                          )
                        ) - straight_angle,
                    },
                  });
                }}
                onMoveEnd={(movement_state) => {
                  let current_to_start_vector = [
                    -movement_state.x,
                    -movement_state.y,
                  ];
                  let start_to_center_vector = vector.rotate(
                    [0, item.height / 2 + 50],
                    item.rotation
                  );

                  let straight_angle = 1 / 2 * Math.PI;
                  onChange({
                    rotation:
                      vector.to_rotation(
                        vector.add(
                          current_to_start_vector,
                          start_to_center_vector
                        )
                      ) - straight_angle,
                  });
                  this.setState({
                    movement_state: null,
                  });
                }}
              >
                <Absolute
                  right="50%"
                  top={-50}
                  style={{ transform: `translateX(50%)` }}
                >
                  <DraggingCircle />
                </Absolute>
              </Draggable>

              {[[-1, -1], [-1, 1], [1, 1], [1, -1]].map((pos) => (
                <Draggable
                  onMove={(movement_state) => {
                   
                    let next_movement = width_height_movement(
                      pos,
                      movement_state
                    )
                    console.log(next_movement, current_item.width)

                    if (next_movement.height + item.height < 0) {

                      return;
                    }
                    if ( next_movement.width + item.width < 0) {
                      return;
                    }

                    this.setState({
                      movement_state: next_movement,
                    });
                  }}
                  onMoveEnd={(movement_state) => {
                    let change = width_height_movement(pos, movement_state);
                    onChange({
                      width: item.width + change.width,
                      x: item.x + change.x,
                      height: item.height + change.height,
                      y: item.y + change.y,
                    });
                    this.setState({
                      movement_state: null,
                    });
                  }}
                >
                  <Absolute
                    left={pos[0] === -1 ? -10 : null}
                    right={pos[0] === 1 ? -10 : null}
                    top={pos[1] === -1 ? -10 : null}
                    bottom={pos[1] === 1 ? -10 : null}
                  >
                    <DraggingCircle />
                  </Absolute>
                </Draggable>
              ))}
            </Absolute>
          )}

          <Draggable
            onMove={(movement_state) => {
              console.log(`${item.id} updated!`);
              this.setState({ movement_state });
            }}
            onMoveEnd={(movement_state) => {
              onChange({
                y: item.y + movement_state.y,
                x: item.x + movement_state.x,
              });
              this.setState({
                movement_state: null,
              });
            }}
          >
            <Absolute right={0} top={0} left={0} bottom={0}>
              {children}
            </Absolute>
          </Draggable>
        </div>
      </Absolute>
    );
  }
}

let JSON_parse_safe = (json) => {
  try {
    return [null, JSON6.parse(json)];
  } catch (err) {
    return [err, null];
  }
};

export class Workspace extends React.Component {
  state = {
    next_id: 1,
    items: [],
    canvas: {
      height: 500,
      width: 500,
    },
    selected_item: null,
    is_pressing_cmd: false,
  };

  render() {
    let { selected_item, items, canvas, next_id, is_pressing_cmd } = this.state;

    let add_component = ({ type }) => {
      let component_info = component_map[type];
      this.setState({
        next_id: next_id + 1,
        selected_item: next_id,
        items: [
          ...items,
          {
            name: `${component_info.name} #${next_id}`,
            id: next_id,
            type: type,
            x: canvas.width / 2,
            y: canvas.height / 2,
            rotation: 0,
            height: 100,
            width: 100,

            options: component_info.default_options || {},
          },
        ],
      });
    };

    let change_item = (id, change) => {
      this.setState({
        items: items.map((x) => {
          if (x.id === id) {
            let unsanitized = {
              ...x,
              ...change,
            };
            return unsanitized;
          } else {
            return x;
          }
        }),
      });
    };

    return (
      <div 
        id='background'
        style={{
          backgroundColor: 'rgb(162, 162, 204)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <DocumentEvent
          name="keydown"
          handler={(e) => {
            if (e.which === 17 || e.which === 91) {
              this.setState({
                is_pressing_cmd: true,
              });
            }
          }}
          passive
        />
        <DocumentEvent
          name="keyup"
          handler={(e) => {
            // TODO Yeah yeah I hear you thinking
            // .... "but what if I press both of them and then release only one?!"
            // .... Well.. don't do that
            if (e.which === 17 || e.which === 91) {
              this.setState({
                is_pressing_cmd: false,
              });
            }
          }}
          passive
        />



        <div
          id='layerPanel'
          style={{
            width: 250,
            backgroundColor: 'rgb(245, 212, 126)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
        add layer
        <hr style={{width: '100%', borderWidth: '1px', borderStyle: 'inset'}}/>

          {Object.entries(component_map).map(([key, comp]) => (
            <div
              style={{ paddingLeft: 50, paddingRight: 50, paddingTop: 20 }}
              onClick={() => {
                add_component({ type: key });
              }}
            >
              {comp.name}
            </div>
          ))}

          <div style={{ height: 50 }} />

         
         layer list
         <hr style={{width: '100%', borderWidth: '1px', borderStyle: 'inset'}}/>


          <div style={{ maxHeight: '30%', overflowY: 'auto' }}>
            {items.map((item) => (
              <div
                onClick={() => {
                  this.setState({ selected_item: item.id });
                }}
                style={{
                  backgroundColor:
                    item.id === selected_item
                      ? 'rgba(255,255,255,.8)'
                      : 'transparent',
                  padding: 16,
                }}
              >
                {item.name}
              </div>
            ))}
          </div>

          </div>




        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              // backgroundColor: 'rgb(255, 255, 255)',
              // boxShadow: '0px 3px 20px black',
              // width: canvas.width,
              // height: canvas.height,
              position: 'relative',
            }}
            onClick={(e) => {
              // Only reset selected_item if the click is **only** on the canvas,
              // and not actually on one of the divs inside
              if (e.target === e.currentTarget) {
                this.setState({ selected_item: null });
              }
            }}
          >
            {items.map((item) => {
              let component_info = component_map[item.type];
              return (
                <CanvasItem
                  key={item.id}
                  item={item}
                  selected={selected_item === item.id}
                  onSelect={() => {
                    this.setState({ selected_item: item.id });
                  }}
                  onChange={(next_item) => {
                    change_item(item.id, next_item);
                  }}
                >
                  <Absolute
                    top={0}
                    left={0}
                    bottom={0}
                    right={0}
                    style={{ pointerEvents: is_pressing_cmd ? 'all' : 'none' }}
                  >
                    <component_info.Component
                      size={item}
                      options={item.options || {}}
                    />
                  </Absolute>
                </CanvasItem>
              );
            })}
          </div>
        </div>

        <div
          id='formatPanel'
          style={{
            width: 250,
            backgroundColor: 'rgb(245, 212, 126)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
         
        format panel / edit layer
         <hr style={{width: '100%', borderWidth: '1px', borderStyle: 'inset'}}/>


          {items.filter((x) => x.id === selected_item).map((item) => {
            let component_info = component_map[item.type];

            let unsaved =
              item.options_unsaved || JSON.stringify(item.options, null, 2);
            let is_the_same = isEqual(
              JSON_parse_safe(unsaved)[1],
              item.options
            );
            return (
              <div style={{ overflowY: 'auto' }}>
                {component_info.ConfigScreen && (
                  <component_info.ConfigScreen
                    value={item.options}
                    onChange={(options) => {
                      change_item(item.id, {
                        options: {
                          ...item.options,
                          ...options,
                        },
                      });
                    }}
                  />
                )}
                <textarea
                  style={{
                    width: `100%`,
                    boxSizing: 'border-box',
                    border: 'none',
                    padding: 16,
                    backgroundColor: 'crimson',
                    color: 'white',
                    fontSize: 12,
                    height: 400,
                  }}
                  value={unsaved}
                  onChange={(e) => {
                    let [err, obj] = JSON_parse_safe(e.target.value);
                    change_item(item.id, {
                      options: err ? item.options : obj,
                      options_unsaved: e.target.value,
                    });
                  }}
                />
              </div>
            );
          })}

          <div style={{ height: 50 }} />

          



          
        </div>
      </div>
    );
  }
}
