"use strict";
var _ = require("underscore");
var Generator = require("./generators").Generator,
    path = require("path");
var defaultIndent = "    ",
    argv = {};


exports.argv = function (argv_) {
    argv = argv_;
}

exports.ModuleGenerator = (function () {
    function CommonJs (usage) {
        this.usage = usage;
        this.indent = 0;
    }
    CommonJs.prototype = new Generator();
    
    var builtins = {
            "object": "an object",
            "array": "an array",
            "int": "an integer",
            "float": "a float",
            "double": "a double",
            "short": "a short)",
            "boolean": "a boolean",
            "string": "a string",
            "long": "a long"
    };
   
    
    CommonJs.prototype.importLines = function (importsArray) {
       return [];
    };

    CommonJs.prototype.packageLines = function (classObject) {
        // NOP;
       var className = classObject.name,
           superClass = classObject.superClass;
       var lines = ["function " + className + " () {"];
       if (!classObject.properties || classObject.properties.length === 0) {
           lines.push(defaultIndent + "// No properties declared");
       }
       _.each(classObject.properties, function (p) {
           var typeName = typeString(p.type),
               paramName = p.name, 
               value = p["default"];
           if (_.isUndefined(value)) {
               value = "null";
           } else {
               value = JSON.stringify(value);
           }
           
           lines.push(defaultIndent + "this." + paramName + " = " + value + "; // " + typeName);
           
       });
       
       lines.push("}");
       if (classObject.superClass) {
           lines.push("var " + superClass + " = require(\"" + superClass + "\");");
           lines.push(className + ".prototype = new " + superClass + "();");
       }
       lines.push("module.exports = " + className + ";");
       lines.push("var Module = " + className + ".prototype;");
       
       return lines;
    };
    
    function typeString (type) {
        var builtin = builtins[type];
        
        return builtin ? builtin : type.name;
    }
    
    function docsLines(docs, params, suppressIndent) {
        if (_.isUndefined(suppressIndent) && _.isBoolean(params)) {
            suppressIndent = params;
            params = null;
        }
        suppressIndent = true;
        var indent = suppressIndent ? "" : defaultIndent;
        
        var lines = [],
            comment = false;
        
        if (docs) {
            comment = true;
            lines.push(indent + "/**");
            lines.push(indent + " * " + docs);
        }

        if (params) {
            _.each(params, function (param) {
                if (!comment) {
                    lines.push(indent + "/**");
                    comment = true;
                }
                
                var paramLine = [" * @param", param.name, "{@link " + typeString(param.type) + "}"];
                if (param.docs) {
                    paramLine.push(param.docs);
                }
                lines.push(indent + paramLine.join(" "));
            });
        }
        
        if (comment) {
            lines.push(indent + " */");
        }
        
        return lines;
    }
    
    
    CommonJs.prototype.interfaceDeclLines = function (classObject) {
        return [];
    };    
    
    CommonJs.prototype.propertyLines = function (properties) {
        // NOP
        return [];
    };
    
    CommonJs.prototype.methodLine = function (sig) {
        var self = this, 
            lines = [],
            comment = false,
            methodName = self.unObjectiveC(sig.name), 
            params  = _.map(sig.params, function (p) {
                return p.name;
            });        

        lines.push(docsLines(sig.docs, sig.params));

        lines.push("Module." + methodName + " = function (" + params.join(", ") + ") {");
        var theComment = this.usage !== 'request' ? "// TODO Copy/paste this stub, and implement" : "// Deprecated. Should never have been generated";
        lines.push(defaultIndent + theComment);
        lines.push(defaultIndent + "throw new Error(\"" + methodName + " is unimplemented\");");
        lines.push("};")
        
        return _.flatten(lines);
    };
    
    CommonJs.prototype.methodLines = function (sigArray) {
        var self = this;
        // TODO check this is working
        var allLines = self.usage === "javascript" ? ["",
            "/*",
            " * Lifecycle methods.",
            " * These should match corresponding native objects, via kirinHelpers",
            " */",
            "Module.onLoad = function (nativeObject) {",
            "    // The native object can be called with this object",
            "    this.nativeObject = nativeObject;",
            "};",
            "",
            "Module.onResume = function () {",
            "     // A screen would get this viewWillAppear or onResume",
            "     // TODO Implement onResume",
            "};", 
            "",
            "Module.onPause = function () {",
            "     // A screen would get this viewWillDisappear or onPause",
            "     // TODO Implement onPause",
            "};", 
            "",
            "Module.onUnload = function () {",
            "    this.nativeObject = null;",
            "};", ""
                        ] : [];
        
        if (sigArray.length > 0) {
            allLines.push([
                "/*",
                " * Method stubs",
                " */",
                ""
            ]);
            allLines = _.flatten(allLines);
        }
         _.each(sigArray, function (sig) {
            var line = self.methodLine(sig);
            allLines.push(line);
            allLines.push("");
            
        });
        return allLines;
    };
    
    CommonJs.prototype.footer = function () {
        return [];
    };
    return CommonJs;
})();
    
var CallbackGenerator = (function () {
    function Callbacks (usage) {
        this.usage = usage;
        this.indent = 0;
    }
    Callbacks.prototype = new Generator();  
    
    Callbacks.prototype.importLines = function (importsArray) {
        return [];
     };

    Callbacks.prototype.packageLines = function (classObject) {
         // NOP;
        var className = classObject.name,
            superClass = classObject.superClass;
        var lines = ["var _ = require('underscore'),",
                     "    kirinBridge = require('kirin-bridge-utils');",
                     "",
                     "function " + className + " (params) {",
                     "    if (typeof params === 'object') {",
                     "        _.extend(this, params);",
                     "    }",
                     "}", 
                     ""];

        if (classObject.superClass) {
            // TODO not sure superclass makes much sense with the way we're doing it.
            lines.push("var " + superClass + " = require(\"" + superClass + "\");");
            lines.push(className + ".prototype = new " + superClass + "();");
            lines.push("");
        }
        lines.push("var instance = " + className + ".prototype;");
        lines.push("module.exports = " + className + ";");
        lines.push("");
        
        return lines;
     };
     
     function typeString (type) {
         return typeof type === 'string' ? type : type.name;
     }
     
     function docsLines(docs, params, suppressIndent) {
         return [];
     }
    Callbacks.prototype.methodLines = function () {
        return [];
    }; 
     
    Callbacks.prototype.interfaceDeclLines = function (classObject) {
        return [];
    };    
     
    Callbacks.prototype.propertyLines = function (properties) {
         // NOP
         return [];
     };
    
    Callbacks.prototype.footer = function (classObject) {
        return this.generateValidate(classObject);
    };
    
    Callbacks.prototype.generateValidate = function (classObject) {
        var self = this, 
            lines = [],
            skipValidation = (argv.buildType !== 'dev');
        if (classObject.role !== 'request') {
           return [];
        }
        
        function appendObject (prefix, object, suffix, indent) {
            var str = JSON.stringify(object, null, indent),
                segments = str.split("\n");
            segments[0] = prefix + segments[0];
            segments[segments.length - 1] += suffix;
            
            _.each(segments, function (line) {
                lines.push(line);
            });
        }
        
        var indent = defaultIndent;
        // TODO if argv.buildType !== 'dev' return [];
        
        // Copies from the src object to the dest object.
        // Simply: dest[destKey] = transform(src[srcKey]); 
        function composeObject (src, srcKey, dest, destKey, transform) {
            if (_.isUndefined(src)) {
                return;
            }
            var value = src[srcKey];
            if (_.isUndefined(value)) {
                return;
            }
            if (_.isArray(value) && _.isEmpty(value)) {
                return;
            }
            
            if (_.isObject(value) && _.isEmpty(value)) {
                return;
            }
            
            if (transform) {
                value = transform(value);
            }
            
            dest[destKey || srcKey] = value;
        }
        
        var schema = {};
        composeObject(classObject, "properties", schema, null, function (properties) {
            var ret = {};
            _.each(properties, function (property) {
                var type = property.type;
                if (!_.isString(type)) {
                    type = "object";
                }
                ret[property.name] = type;
            });
            return ret;
        });
        composeObject(classObject, "methods", schema, null, function (methods) {
            var ret = {};
            
            _.each(methods, function (method) {
                var args = _.pluck(method.params, "name");
                ret[self.unObjectiveC(method.name)] = args;
            });
            
            return ret;
        });
        composeObject(classObject.validate, "defaults", schema);
        composeObject(classObject.validate, "mandatory", schema, null, function (mandatory) {
            return _.map(mandatory, self.unObjectiveC);
        });
        composeObject(classObject.validate, "acceptableForms", schema, "allowable");
        
        appendObject("instance.kirin_bridgeUtils = new kirinBridge.BridgeUtils(", schema, ", " + skipValidation + ");", indent);

        return lines;
        
    };
    
    return Callbacks;
}());

exports.getOutputDirectory = function (nodeModule, kirinInfo, platformBlock) {
    return path.join(nodeModule.directory, kirinInfo.idlOutput);
};

exports.generateFiles = function (filePrefix, classOrder, fileMap, nodeModule) {
    fileMap = fileMap || {};
    var generator;
    
    if (!filePrefix) {
        throw new Error("An idlOutput is needed in package.json");
    }
    
    _.each(classOrder, function (irClass) {
        if (!irClass) {
            return;
        }
        if (irClass.role === "javascript") {
            generator = new exports.ModuleGenerator()
            var lines = generator.lines(irClass),
                content = lines.join("\n"),
                filename = path.join(irClass.location, "stubs", irClass.name + ".stub.js");
            
            fileMap[path.join(filePrefix, filename)] = content;
            // this is wrong! addFile breaks immutability
            nodeModule.addFile(path.join(filePrefix, filename));
        } else if (irClass.role === "request") {
            generator = new CallbackGenerator();
            var lines = generator.lines(irClass),
                content = lines.join("\n"),
                filename = path.join(irClass.location, irClass.name + ".js");
        
            fileMap[path.join(filePrefix, filename)] = content;
           // nodeModule.addFile(path.join(filePrefix, filename));            
        }
    });
    
    return fileMap;
};
