"use strict";var utils=require("./utils");var UNDEFINED="undefined";var FUNCTION="function";var OBJECT="object";var STRING="string";var NUMBER="number";var BOOLEAN="boolean";var REQUIRED='The field "@" is required.';var DEFAULT_SCHEMA="default";var DEFAULT_SCHEMA_PROPERTY="$state";var schemas={};var transforms={};function SchemaBuilder(name){this.name=name;this.collection={}}SchemaBuilder.prototype.get=function(name){return this.collection[name]};SchemaBuilder.prototype.add=function(name,obj,properties,validator){var self=this;self.collection[name]=new SchemaBuilderEntity(self,name,obj,validator,properties);return self.collection[name]};SchemaBuilder.prototype.remove=function(name){var self=this;if(name===undefined){delete schemas[name];self.collection=null;return}var schema=self.collection[name];if(schema)schema.remove();schema=null;return self};function SchemaBuilderEntity(parent,name,obj,validator,properties){this.parent=parent;this.name=name;this.schema=obj;this.properties=properties===undefined?Object.keys(obj):properties;this.transforms;this.onDefault;this.onValidation=validator;this.onSave;this.onGet;this.onRemove;this.onQuery}SchemaBuilderEntity.prototype.getDependencies=function(){var self=this;var arr=Object.keys(self.schema);var dependencies=[];for(var i=0,length=arr.length;i<length;i++){var name=arr[i];var type=self.schema[name];if(typeof type!==STRING)continue;var isArray=type[0]==="]";if(isArray)type=type.substring(1,type.length-1);var m=self.parent.get(type);if(typeof m===undefined)continue;dependencies.push({name:name,isArray:isArray,schema:m})}return dependencies};SchemaBuilderEntity.prototype.setValidation=function(properties,fn){var self=this;if(typeof properties!==FUNCTION){self.properties=properties;self.onValidation=fn}else self.onValidation=properties;return self};SchemaBuilderEntity.prototype.setDefault=function(fn){var self=this;self.onDefault=fn;return self};SchemaBuilderEntity.prototype.setSave=function(fn){var self=this;self.onSave=fn;return self};SchemaBuilderEntity.prototype.setGet=function(fn){var self=this;self.onGet=fn;return self};SchemaBuilderEntity.prototype.setQuery=function(fn){var self=this;self.onQuery=fn;return self};SchemaBuilderEntity.prototype.setRemove=function(fn){var self=this;self.onRemove=fn;return self};SchemaBuilderEntity.prototype.setProperties=function(properties){var self=this;self.properties=properties;return self};SchemaBuilderEntity.prototype.addTransform=function(name,fn){var self=this;if(!self.transforms)self.transforms={};self.transforms[name]=fn;return self};SchemaBuilderEntity.prototype.addWorkflow=function(name,fn){var self=this;if(!self.workflows)self.workflows={};self.workflows[name]=fn;return self};SchemaBuilderEntity.prototype.find=function(name){return this.parent.get(name)};SchemaBuilderEntity.prototype.destroy=function(){var self=this;delete self.parent.collection[self.name];self.properties=null;self.schema=null;self.onDefault=null;self.onValidation=null;self.onSave=null;self.onRead=null;self.onRemove=null;self.onQuery=null;self.workflows=null;self.transforms=null};SchemaBuilderEntity.prototype.saveMultiple=function(model,helper,callback){if(callback===undefined){callback=helper;helper=undefined}var repository;var output=[];if(model instanceof Array)repository=model;else repository=[model];var self=this;var builder=new ErrorBuilder;for(var i=0,length=repository.length;i<length;i++){var item=repository[i];var noPrepare=self._getStateOfModel(item,0)==="1";var noValidate=self._getStateOfModel(item,1)==="1";var prepared=noPrepare===true?utils.copy(item):self.prepare(item);if(noValidate===true||self.onValidation===undefined){if(!builder.hasError())output.push(prepared);continue}builder.add(self.validate(prepared));if(!builder.hasError())output.push(prepared)}if(builder.hasError()){callback(builder);return self}repository=[];output.wait(function(item,next){self.onSave(builder,output,helper,function(value){repository.push(value);next()})},function(){callback(builder.hasError()?builder:null,repository)});return self};SchemaBuilderEntity.prototype.save=function(model,helper,callback){if(callback===undefined){callback=helper;helper=undefined}var self=this;var noPrepare=self._getStateOfModel(model,0)==="1";var noValidate=self._getStateOfModel(model,1)==="1";var output=noPrepare===true?utils.copy(model):self.prepare(model);var builder=noValidate===true||self.onValidation===undefined?new ErrorBuilder:self.validate(output);if(builder.hasError()){callback(builder);return self}self.onSave(builder,output,helper,function(value){callback(builder.hasError()?builder:null,value===undefined?output:value)});return self};SchemaBuilderEntity.prototype.get=function(helper,callback){if(callback===undefined){callback=helper;helper=undefined}var self=this;var builder=new ErrorBuilder;var output=self.default();self.onGet(builder,output,helper,function(value){callback(builder.hasError()?builder:null,value===undefined?output:value)});return self};SchemaBuilderEntity.prototype.remove=function(helper,callback){if(callback===undefined){callback=helper;helper=undefined}var self=this;var builder=new ErrorBuilder;self.onRemove(builder,helper,function(value){callback(builder.hasError()?builder:null,value===undefined?helper:value)});return self};SchemaBuilderEntity.prototype.query=function(helper,callback){if(callback===undefined){callback=helper;helper=undefined}var self=this;var builder=new ErrorBuilder;self.onQuery(builder,helper,function(value){callback(builder.hasError()?builder:null,value)});return self};SchemaBuilderEntity.prototype.validate=function(model,resourcePrefix,resourceName,builder){var self=this;var fn=self.onValidation;if(builder===undefined)builder=new ErrorBuilder;if(fn===undefined||fn===null){if(typeof framework.onValidation!==FUNCTION){if(framework&&framework.error)framework.error(new Error('Schema "'+name+"\" doesn't defined a validation delegate."),self.parent.name+"."+self.name+".validate()",null);return builder}fn=framework.onValidation}if(resourceName)builder.resourceName=resourceName;if(resourcePrefix)builder.resourcePrefix=resourcePrefix;self._setStateToModel(model,1,1);return utils.validate.call(self,model,self.name,fn,builder,undefined,self.name,self.parent.collection)};SchemaBuilderEntity.prototype._getStateOfModel=function(model,index){return(model[DEFAULT_SCHEMA_PROPERTY]||"")[index]||"0"};SchemaBuilderEntity.prototype._setStateToModel=function(model,index,value){var item=model[DEFAULT_SCHEMA_PROPERTY];if(typeof value!==OBJECT)value=value.toString();if(!item)model[DEFAULT_SCHEMA_PROPERTY]="01";else if(item[1]!==value)model[DEFAULT_SCHEMA_PROPERTY]=item.replaceAt(1,value);return this};SchemaBuilderEntity.prototype.create=function(){return this.default()};SchemaBuilderEntity.prototype.default=function(){var self=this;var obj=self.schema;if(obj===null)return null;var defaults=self.onDefault;var item=utils.extend({},obj,true);var properties=Object.keys(item);for(var i=0,length=properties.length;i<length;i++){var property=properties[i];var value=item[property];var type=typeof value;if(defaults){var def=defaults(property,true,self.name);if(def!==undefined){item[property]=def;continue}}if(type===FUNCTION){if(value===Number){item[property]=0;continue}if(value===Boolean){item[property]=false;continue}if(value===String){item[property]="";continue}if(value===Date){item[property]=new Date;continue}if(value===Object){item[property]={};continue}if(value===Array){item[property]=[];continue}item[property]=value();continue}if(type===NUMBER){item[property]=0;continue}if(type===BOOLEAN){item[property]=false;continue}if(type===OBJECT){item[property]=value instanceof Array?[]:{};continue}if(type!==STRING){item[property]=null;continue}var isArray=value[0]==="[";if(isArray)value=value.substring(1,value.length-1);if(isArray){item[property]=[];continue}var lower=value.toLowerCase();if(lower.contains([STRING,"text","varchar","nvarchar","binary","data","base64"])){item[property]="";continue}if(lower.contains(["int",NUMBER,"decimal","byte","float","double"])){item[property]=0;continue}if(lower.contains("bool")){item[property]=false;continue}if(lower.contains(["date","time"])){item[property]=new Date;continue}if(lower.contains(["object"])){item[property]={};continue}if(lower.contains(["array"])){item[property]=[];continue}if(lower.contains(["binary","data","base64"])){item[property]=null;continue}var child=self.parent.get(value);item[property]=child?child.default():null}return item};SchemaBuilderEntity.prototype.prepare=function(model,dependencies){var self=this;var obj=self.schema;if(obj===null)return null;if(model===null||model===undefined)return self.default();var tmp;var item=utils.extend({},obj,true);var properties=Object.keys(item);var defaults=self.onDefault;for(var i=0,length=properties.length;i<length;i++){var property=properties[i];var val=model[property];if(val===undefined&&defaults)val=defaults(property,false,self.name);if(val===undefined)val="";var value=item[property];var type=typeof value;var typeval=typeof val;if(typeval===FUNCTION)val=val();if(type===FUNCTION){if(value===Number){item[property]=utils.parseFloat(val);continue}if(value===Boolean){tmp=val.toString();item[property]=tmp==="true"||tmp==="1";continue}if(value===String){item[property]=val===undefined||val===null?"":val.toString();continue}if(value===Date){tmp=null;switch(typeval){case OBJECT:if(utils.isDate(val))tmp=val;else tmp=null;break;case NUMBER:tmp=new Date(val);break;case STRING:if(val==="")tmp=null;else tmp=val.parseDate();break}if(tmp!==null&&typeof tmp===OBJECT&&tmp.toString()==="Invalid Date")tmp=null;item[property]=tmp||(defaults?isUndefined(defaults(property,false,self.name),null):null);continue}if(value===Object){item[property]=model[property];continue}item[property]=defaults?isUndefined(defaults(value,false,name),null):null;continue}if(type===OBJECT){item[property]=typeval===OBJECT?val:null;continue}if(type===NUMBER){item[property]=utils.parseFloat(val);continue}if(val===null||typeval===UNDEFINED)tmp="";else tmp=val.toString();if(type===BOOLEAN){item[property]=tmp==="true"||tmp==="1";continue}if(type!==STRING){item[property]=tmp;continue}var isArray=value[0]==="["||value==="array";if(isArray){if(value[0]==="[")value=value.substring(1,value.length-1);else value=null;if(!(val instanceof Array)){item[property]=defaults?isUndefined(defaults(property,false,name),[]):[];continue}item[property]=[];for(var j=0,sublength=val.length;j<sublength;j++){if(value===null){item[property].push(model[property][j]);continue}var tmp=model[property][j];switch(value.toLowerCase()){case"string":case"varchar":case"text":item[property].push((tmp||"").toString());break;case"bool":case"boolean":tmp=(tmp||"").toString().toLowerCase();item[property].push(tmp==="true"||tmp==="1");break;case"int":case"integer":item[property].push(utils.parseInt(tmp));break;case"number":item[property].push(utils.parseFloat(tmp));break;default:var entity=self.parent.get(value);if(entity){item[property][j]=entity.prepare(tmp,dependencies);if(dependencies)dependencies.push({name:value,value:item[property][j]})}else item[property][j]=null;break}}continue}var lower=value.toLowerCase();if(lower.contains([STRING,"text","varchar","nvarchar"])){var beg=lower.indexOf("(");if(beg===-1){item[property]=tmp;continue}var size=lower.substring(beg+1,lower.length-1).parseInt();item[property]=tmp.max(size,"...");continue}if(lower.contains(["int","byte"])){item[property]=utils.parseInt(val);continue}if(lower.contains(["decimal",NUMBER,"float","double"])){item[property]=utils.parseFloat(val);continue}if(lower.contains("bool",BOOLEAN)){item[property]=tmp==="true"||tmp==="1";continue}if(lower.contains(["date","time"])){if(typeval==="date"){item[property]=val;continue}if(typeval===STRING){item[property]=val.parseDate();continue}if(typeval===NUMBER){item[property]=new Date(val);continue}item[property]=isUndefined(defaults(property,false,name));continue}var entity=self.parent.get(value);if(entity){item[property]=entity.prepare(val);if(dependencies)dependencies.push({name:value,value:item[property]})}else item[property]=null}self._setStateToModel(model,0,1);return item};SchemaBuilderEntity.prototype.transform=function(name,model,helper,callback){var self=this;if(callback===undefined){callback=helper;helper=undefined}var trans=self.transforms?self.transforms[name]:undefined;if(!trans){callback((new ErrorBuilder).add("","Transform not found."));return}var noPrepare=self._getStateOfModel(model,0)==="1";var noValidate=self._getStateOfModel(model,1)==="1";var output=noPrepare===true?utils.copy(model):self.prepare(model);var builder=self.onValidation===undefined||noValidate===true?new ErrorBuilder:self.validate(output);if(builder.hasError()){callback(builder);return}trans.call(self,output,builder,helper,function(result){callback(builder.hasError()?builder:null,result===undefined?output:result,model)},self);return self};SchemaBuilderEntity.prototype.workflow=function(name,model,helper,callback){var self=this;if(callback===undefined){callback=helper;helper=undefined}var workflow=self.workflows?self.workflows[name]:undefined;if(!workflow){callback((new ErrorBuilder).add("","Workflow not found."));return}var noPrepare=self._getStateOfModel(model,0)==="1";var noValidate=self._getStateOfModel(model,1)==="1";var output=noPrepare===true?utils.copy(model):self.prepare(model);var builder=noValidate===true||self.onValidation===undefined?new ErrorBuilder:self.validate(output);if(builder.hasError()){callback(builder);return}workflow.call(self,output,builder,helper,function(result){callback(builder.hasError()?builder:null,result===undefined?output:result,model)},self);return self};SchemaBuilderEntity.prototype.clean=function(model,isCopied){if(model===null||model===undefined)return model;if(isCopied)model=utils.copy(model);delete model[DEFAULT_SCHEMA_PROPERTY];var keys=Object.keys(model);for(var i=0,length=keys.length;i<length;i++){var key=keys[i];var value=model[key];if(value===null)continue;if(typeof value!==OBJECT)continue;if(value instanceof Array){for(var j=0,sublength=value.length;j<sublength;j++){var item=value[j];if(item===null)continue;if(typeof item!==OBJECT)continue;self.clean(item,true)}continue}self.clean(value,true)}return model};function ErrorBuilder(onResource){this._errors=[];this.onResource=onResource;this.resourceName="default";this.resourcePrefix="";this.count=0;this.replacer=[];this.isPrepared=false;if(onResource===undefined)this._resource()}function UrlBuilder(){this.builder={}}function Pagination(items,page,max,format){this.isNext=false;this.isPrev=false;this.items=items;this.count=0;this.skip=0;this.take=0;this.page=0;this.max=0;this.visible=false;this.format=format||"?page={0}";this.refresh(items,page,max)}exports.schema=function(name,obj,defaults,validator,properties){if(obj===undefined){if(schemas[name]===undefined)schemas[name]=new SchemaBuilder(name);return schemas[name]}if(schemas[DEFAULT_SCHEMA]===undefined)schemas[DEFAULT_SCHEMA]=new SchemaBuilder(DEFAULT_SCHEMA);if(typeof defaults!==FUNCTION)defaults=undefined;if(typeof validator!==FUNCTION)validator=undefined;if(!(properties instanceof Array))properties=undefined;var schema=schemas[DEFAULT_SCHEMA].add(name,obj,properties,validator);if(defaults)schema.setDefault(defaults);return obj};exports.remove=function(name){delete schemas[name]};exports.isJoin=function(collection,value){if(!value)return false;if(value[0]==="[")return true;if(collection===undefined)return false;return collection[value]!==undefined};exports.validation=function(name,properties,fn){if(schemas[DEFAULT_SCHEMA]===undefined)return[];var schema=schemas[DEFAULT_SCHEMA].get(name);if(schema===undefined)return[];if(fn instanceof Array&&typeof properties===FUNCTION){var tmp=fn;fn=properties;properties=fn}if(typeof fn===FUNCTION){schema.onValidation=fn;if(properties===undefined)schema.properties=Object.keys(schema.schema);else schema.properties=properties;return true}if(fn===undefined){var validator=schema.properties;if(validator===undefined)return Object.keys(schema.schema);return validator||[]}schema.onValidation=fn;return fn};exports.validate=function(name,model,resourcePrefix,resourceName){var schema=schemas[DEFAULT_SCHEMA];if(schema===undefined)return null;schema=schema.get(name);if(schema===undefined)return null;var fn=schema.onValidation;return schema.validate(model,resourcePrefix,resourceName)};exports.create=function(name){return exports.defaults(name)};exports.defaults=function(name){if(schemas[DEFAULT_SCHEMA]===undefined)return null;var schema=schemas[DEFAULT_SCHEMA].get(name);if(schema===undefined)return null;return schema.default()};exports.prepare=function(name,model){if(schemas[DEFAULT_SCHEMA]===undefined)return null;var schema=schemas[DEFAULT_SCHEMA].get(name);if(schema===undefined)return null;return schema.prepare(model)};function isUndefined(value,def){if(value===undefined)return def;return value}ErrorBuilder.prototype={get errors(){var self=this;if(!self.isPrepared)self.prepare();return self._errors},get error(){var self=this;if(!self.isPrepared)self.prepare();return self._errors}};ErrorBuilder.prototype.resource=function(name,prefix){var self=this;self.resourceName=name||"default";self.resourcePrefix=prefix||"";return self._resource()};ErrorBuilder.prototype._resource=function(){var self=this;self.onResource=function(name){var self=this;if(typeof framework!==UNDEFINED)return framework.resource(self.resourceName,self.resourcePrefix+name);return name};return self};ErrorBuilder.prototype.add=function(name,error,path){var self=this;self.isPrepared=false;if(name instanceof ErrorBuilder){if(name.hasError()){name.errors.forEach(function(o){self.errors.push(o)});self.count=self._errors.length}return self}if(error===undefined){error=name;name=""}if(error===undefined||error===null)return self;if(error instanceof Error)error=error.toString();self._errors.push({name:name,error:typeof error===STRING?error:(error||"").toString()||"@",path:path});self.count=self._errors.length;return self};ErrorBuilder.prototype.remove=function(name){var self=this;self._errors=self._errors.remove(function(o){return o.name===name});self.count=self._errors.length;return self};ErrorBuilder.prototype.hasError=function(name){var self=this;if(name){return self._errors.find(function(o){return o.name===name})!==null}return self._errors.length>0};ErrorBuilder.prototype.read=function(name){var self=this;if(!self.isPrepared)self.prepare();var error=self._errors.find(function(o){return o.name===name});if(error!==null)return error.error;return null};ErrorBuilder.prototype.clear=function(){var self=this;self._errors=[];self.count=0;return self};ErrorBuilder.prototype.replace=function(search,newvalue){var self=this;self.isPrepared=false;self.replacer[search]=newvalue;return self};ErrorBuilder.prototype.json=function(beautify,replacer){if(beautify)return JSON.stringify(this.prepare()._errors,replacer,"	");return JSON.stringify(this.prepare()._errors,replacer)};ErrorBuilder.prototype.JSON=function(beautify){if(beautify)return JSON.stringify(this.prepare()._errors,null,"	");return JSON.stringify(this.prepare()._errors)};ErrorBuilder.prototype._prepare=function(){var self=this;if(self.onResource===null)return self;var errors=self._errors;var length=errors.length;for(var i=0;i<length;i++){var o=errors[i];if(o.error[0]!=="@")continue;if(o.error.length===1)o.error=self.onResource(o.name);else o.error=self.onResource(o.error.substring(1));if(o.error===undefined)o.error=REQUIRED.replace("@",o.name)}return self};ErrorBuilder.prototype.toString=function(){var self=this;if(!self.isPrepared)self.prepare();var errors=self._errors;var length=errors.length;var builder=[];for(var i=0;i<length;i++)builder.push(errors[i].error||errors[i].name);return builder.join("\n")};ErrorBuilder.prototype._prepareReplace=function(){var self=this;var errors=self._errors;var lengthBuilder=errors.length;var keys=Object.keys(self.replacer);var lengthKeys=keys.length;if(lengthBuilder===0||lengthKeys===0)return self;for(var i=0;i<lengthBuilder;i++){var o=errors[i];for(var j=0;j<lengthKeys;j++){var key=keys[j];o.error=o.error.replace(key,self.replacer[key])}}return self};ErrorBuilder.prototype.prepare=function(){var self=this;if(self.isPrepared)return self;self._prepare()._prepareReplace();self.isPrepared=true;return self};ErrorBuilder.transform=function(name,fn){var self=this;transforms["error"][name]=fn;return self};Pagination.prototype.refresh=function(items,page,max){var self=this;self.count=Math.floor(items/max)+(items%max>0?1:0);self.page=page-1;if(self.page<0)self.page=0;self.items=items;self.skip=self.page*max;self.take=max;self.max=max;self.isPrev=self.page>0;self.isNext=self.page<self.count-1;self.visible=self.count>1;self.page++;return self};Pagination.prototype.prev=function(format){var self=this;var page=0;format=format||self.format;if(self.isPrev)page=self.page-1;else page=self.count;return{url:format.format(page,self.items,self.count),page:page,selected:false}};Pagination.prototype.next=function(format){var self=this;var page=0;format=format||self.format;if(self.isNext)page=self.page+1;else page=1;return{url:format.format(page,self.items,self.count),page:page,selected:false}};Pagination.prototype.render=function(max,format){var self=this;var builder=[];format=format||self.format;if(typeof max===STRING){var tmp=format;format=max;max=format}if(max===undefined||max===null){for(var i=1;i<self.count+1;i++)builder.push({url:format.format(i,self.items,self.count),page:i,selected:i===self.page});return builder}var half=Math.floor(max/2);var pages=self.count;var pageFrom=self.page-half;var pageTo=self.page+half;var plus=0;if(pageFrom<=0){plus=Math.abs(pageFrom);pageFrom=1;pageTo+=plus}if(pageTo>=pages){pageTo=pages;pageFrom=pages-max}if(pageFrom<0)pageFrom=1;for(var i=pageFrom;i<pageTo+1;i++)builder.push({url:format.format(i,self.items,self.count),page:i,selected:i===self.page});return builder};UrlBuilder.prototype.add=function(name,value){var self=this;if(typeof name==="object"){Object.keys(name).forEach(function(o){self.builder[o]=name[o]});return}self.builder[name]=value;return self};UrlBuilder.prototype.remove=function(name){var self=this;delete self.builder[name];return self};UrlBuilder.prototype.read=function(name){return this.builder[name]||null};UrlBuilder.prototype.clear=function(){var self=this;self.builder={};return self};UrlBuilder.prototype.toString=function(url,skipEmpty){if(typeof url===BOOLEAN){var tmp=skipEmpty;skipEmpty=url;url=tmp}var self=this;var builder=[];Object.keys(self.builder).forEach(function(o){var value=self.builder[o];if(value===undefined||value===null)value="";else value=value.toString();if(skipEmpty&&value==="")return;builder.push(o+"="+encodeURIComponent(value))});if(typeof url===STRING){if(url[url.length-1]!=="?")url+="?"}else url="";return url+builder.join("&")};UrlBuilder.prototype.hasValue=function(keys){if(keys===undefined)return false;var self=this;if(typeof keys==="string")keys=[keys];for(var i=0;i<keys.length;i++){var val=self.builder[keys[i]];if(val===undefined||val===null)return false}return true};UrlBuilder.prototype.toOne=function(keys,delimiter){var self=this;var builder=[];keys.forEach(function(o){builder.push(self.builder[o]||"")});return builder.join(delimiter||"&")};exports.SchemaBuilder=SchemaBuilder;exports.ErrorBuilder=ErrorBuilder;exports.Pagination=Pagination;exports.UrlBuilder=UrlBuilder;