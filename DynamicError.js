
// This creates Derived extends Base {constructor(v) {super(v); }} for each
// member of targets. This is intended for making Error() derived classes that
// just pass a single arg as a quick and easy way to avoid that repetition.
// Usage:
/*
  class LocalError extends Error {
    constructor(val) {
      super(val);
    }
  };

  const err = derived_errors(LocalError, {
    not_def:"NotDefinedInContainer",
    call_wrong:"CallGivenWrongArguments"
  });

  throw new err.not_def("die here");
  RESULT:
    throw new err.not_def("die here");
    ^

    NotDefinedInContainer [Error]: die here
*/
// NOTICE: it used the right LONG name, even though called with the short. So consumers
// of the exceptions can catch the real target.
function createDerivedErrorClasses(base, targets) {
    result = {};
    for (let short of Object.getOwnPropertyNames(targets)) {
        const long = targets[short];
        result[short] = ({ [long]: class extends base { constructor(v) { super(v); this.name = long} } })[long];
    }
    return result;
}


/* USAGE EXAMPLE
class TypeAnnotationError extends Error { constructor(detail) { super(detail); } };

const err = create_derived_error_classes(TypeAnnotationError, {
    not_symbol: "SymbolExpectedAndNotProvided",
    prop_redef: "AttemptingToRedefinePropertyDefinition",
    type_name_missing: "NoTypeNameDefinedInTypeinfoArgument",
    invalid_examplar: "ExemplarMustBeDefinedOrNull",
    matcher_forbidden: "MatcherForbiddenWithNonNullExemplar",
    type_defined: "TypeAlreadyDefined",
    prop_unknown: "AttemptToSetUnkonwnPropertyInTypeInfo",
    prop_assigned: "AlreadyAssignedProperty",
    unknown_type: "UnknownTypeRequested",
    not_symbol_for_type: "TypeRequestedNotSymbol",
    value_rejected: "ValueNotAllowedInProperty",
    type_info_missing: "InitialTypeInfoMustBeProvided",
    annotation_forbidden: "ForbiddenToAnnotateObject",
    prop_not_fetchable: "UnableToFetchPropertyFromType"
});
*/

module.exports = {
    createDerivedErrorClasses: createDerivedErrorClasses
}
