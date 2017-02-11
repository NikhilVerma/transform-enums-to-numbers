// const traverse = require('babel-traverse').default;
const t = require('babel-types');

const fs = require('fs');
const ProtoBuf = require('protobufjs');

// console.log(process.cwd());

// throw new Error(process.cwd());

// let badooProto;
// let hotpanelProto;

// const badooProto = fs.readFileSync(path_.join('..', '..', '..', 'proto', 'bma.proto'), {
//     encoding: 'utf8'
// });

// const hotpanelProto = fs.readFileSync(path_.join('..', '..', '..', 'proto', 'hotpanel.proto'), {
//     encoding: 'utf8'
// });

let PROTOCOL;

// const unusedImportVisitor = {
//     VariableDeclaration(path) {
//         // const parent = path.get('parent');

//         // const identifier = path.get('declarations.0.id');
//         // const isReferenced = identifier.isReferenced();
//         // const isReferenced = t.isReferenced(identifier, parent);
//         // const hasBinding = path.get('parent').scope.hasBinding(enumName);

//         // debugger;

//         // const matchingEnum = BADOO_ENUMS[enumName] || HOTPANEL_ENUMS[enumName];

//         // if (matchingEnum) {
//         //     const callee = path.get('declarations.0.init.callee');
//         //     const argument0 = path.get('declarations.0.init.arguments.0.value');

//         //     if (callee.node.name === 'require' &&

//         // }
//     }
// };

const convertEnumsToNumbers = {
    MemberExpression(path) {
        const calledEnum = path.get('object.name').node;
        const calledProp = path.get('property');

        const matchingEnum = PROTOCOL[calledEnum];

        if (typeof matchingEnum === 'number' && calledProp.node) {
            let propertyName;

            // MessageType.PING
            if (calledProp.isLiteral()) {
                propertyName = calledProp.node.value;
            }
            // MessageType['PING']
            else if (calledProp.isIdentifier()) {
                propertyName = calledProp.node.name;
            }
            else {
                return;
            }

            // Enum value not found
            if (matchingEnum[propertyName] === undefined) {
                return;
            }

            path.replaceWith(
                t.expressionStatement(t.numericLiteral(matchingEnum[propertyName]))
            );
        }
    }
};

module.exports = function () {
    return {
        visitor: {
            Program(path, file) {

                // Initialise and parse the protocol when passed
                if (!PROTOCOL) {
                    PROTOCOL = getEnumsObj(new ProtoBuf.DotProto.Parser(
                        fs.readFileSync(file.opts.protofile, {
                            encoding: 'utf8'
                        })
                    ).parse());
                }

                // Convert all enums to numbers
                path.traverse(convertEnumsToNumbers);

                // Remove any unused imports of enums
                // path.traverse(unusedImportVisitor);
            }
        }
    };
};

function getEnumsObj(proto) {
    const enums = {};

    proto.enums.forEach(enum_ => {
        enums[enum_.name] = {};

        enum_.values.forEach(value => {
            enums[enum_.name][value.name] = value.id;
        });
    });

    return enums;
}
