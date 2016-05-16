/**** Code for custom variable dropdowns ****/
'use strict';

/* Set up inheritance */
goog.provide('Blockly.FieldMathVariable');

goog.require('Blockly.FieldFlydown');
goog.require('Blockly.Msg');
goog.require('Blockly.Variables');
goog.require('goog.string');

/**
 * A text input for a math variable. Notable characteristics:
 *   - variable names are restricted to one alphabetic character
 *   - variables are typed
 *   - hovering over the field will (optionally) produce a flydown with variable block for easy access
 * Based on FieldFlydown from App Inventor.
 * @param {?bool} opt_flydown If true, on mouseover a flyout will appear with a block for this variable, for easy access.
 * @param {?bool} opt_strict If true, field highlights out-of-scope variables which are not quantified or predefined global variables.
 */
Blockly.FieldMathVariable = function(varname, opt_type, opt_validator, opt_flydown, opt_strict) {
  Blockly.FieldMathVariable.superClass_.constructor.call(this, varname,
      true,   /* isEditable */
      Blockly.FieldFlydown.DISPLAY_BELOW,   /* displayLocation */
      (opt_validator != null ? opt_validator : Blockly.FieldMathVariable.validator_),
      1   /* opt_maxlength - maximum allowed input length */
    );
  this.enforceScope_ = !!opt_strict;
  this.useFlydown_ = !!opt_flydown;
  this.type_ = opt_type;
  this.onchange = function() {console.log("onchange", this.getValue()); };
};
goog.inherits(Blockly.FieldMathVariable, Blockly.FieldFlydown);

Blockly.FieldMathVariable.prototype.isVariable_ = true;

/* CSS class for the flydown */
Blockly.FieldMathVariable.prototype.flyoutCSSClassName = 'blocklyFieldMathVariableFlydown';

// Called when field is installed on a block.
Blockly.FieldMathVariable.prototype.init = function(block) {
  if( this.useFlydown_ ) {
    Blockly.FieldMathVariable.superClass_.init.call( this, block );
  } else {
    /* Skip FieldFlydown init and go straight to FieldTextInput init */
    Blockly.FieldFlydown.superClass_.init.call( this, block );
  }
  Blockly.FieldMathVariable.runQueuedCSSActions_.call( this );
};

Blockly.FieldMathVariable.runQueuedCSSActions_ = function() {
  for( var i in this.queuedCSSAction_ ) this.queuedCSSAction_[i]();
}

Blockly.FieldMathVariable.prototype.addCSSClass = function(c) {
  if( this.fieldGroup_ ) {
    /* If field has already been initialised then just add the class. */
    Blockly.addClass_( this.fieldGroup_, c );
  } else {
    /* If field hasn't yet been initialised, then queue the action until init is called. */
    var t = this;
    if( !this.queuedCSSAction_ ) this.queuedCSSAction_ = [];
    this.queuedCSSAction_.push( function(){t.addCSSClass(c);} );
  }
}

Blockly.FieldMathVariable.prototype.removeCSSClass = function(c) {
  if( this.fieldGroup_ ) {
    Blockly.removeClass_( this.fieldGroup_, c );
  } else {
    var t = this;
    if( !this.queuedCSSAction_ ) this.queuedCSSAction_ = [];
    this.queuedCSSAction_.push( function(){t.removeCSSClass(c);} );
  }
}

Blockly.FieldMathVariable.validator_ = function(text) {
  return( (text.length == 1 && text.search(/^[a-zA-Zα-ωΑ-Ωϵ]$/) == 0) ? text : null ); // Regexp: string consists of a single alphabetic Latin or Greek character.
}

Blockly.FieldMathVariable.prototype.setValue = function(text) {
  console.log( "FieldMathVariable setValue('" + text + "')" );
  if( this.sourceBlock_ && !this.sourceBlock_.isInFlyout ) {
    /* Check for variable collisions */
    Blockly.FieldMathVariable.checkVars_( text, this.sourceBlock_.workspace );
  }
  Blockly.FieldMathVariable.superClass_.setValue.call(this, text);
}

Blockly.FieldMathVariable.checkVars_ = function(varname, workspace) {
//  debugger;
  console.log( "checkVars_ ", varname );
  /* Iterate over all variables from the workspace, and check if their types match */
  var blocks = workspace.getAllBlocks();
  var varlist = [];
  var lasttype = null;
  var mismatch = false;
  for( var i in blocks ) {
    var b = blocks[i];
    for( var j in b.inputList ) {
      var input = b.inputList[j];
      for( var k in input.fieldRow ) {
        var field = input.fieldRow[k];
        if( field instanceof Blockly.FieldMathVariable ) {
          var vname = field.getValue();
          if( vname == varname ) {
            /* Found variable with same name. Add it to list*/
            varlist.push( [vname, field.type_, field] );
            /* Check if we have a type mismatch */
            if( field.type_ != lasttype ) {
              if( lasttype ) mismatch = true;
              lasttype = field.type_;
            }
          }
        }
      }
    }
  }
  console.log( (mismatch?"MISMATCH":"ok"), varlist );
  for( var i in varlist ) {
    if( mismatch ) {
      /* Highlight field in red */
      varlist[i][2].addCSSClass("blocklyMathVariableError");
    } else {
      /* Remove red highlight */
      varlist[i][2].removeCSSClass("blocklyMathVariableError");
    }
  }
}

Blockly.FieldMathVariable.prototype.flydownBlocksXML_ = function() {
  /* TODO: Handle other variable types */
  var getterSetterXML =
      '<xml>' +
        '<block type="number_variable">' +
          '<field name="VARNAME">' +
            this.getText() +
          '</field>' +
        '</block>' +
      '</xml>';
  return getterSetterXML;
}
