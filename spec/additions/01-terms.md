## Terms

[[def: read grant, read grants]]:
~ An entry in the asset state’s `readers` list naming a DID that a host may serve a private Original to. Hosts enforce it; it confers no authority to sign ([P8.6](#p8.6)).

[[def: signer set]]:
~ The DIDs and threshold in a set Original's `authors` member, which take the place of a single author ([P5.19](#p5.19)).

[[def: set Original, set Originals]]:
~ An Original whose asset state has an `authors` member. Its `author` is an array naming each member who signed, and its author entries carry one proof per signer ([P5.19](#p5.19), [P5.22](#p5.22)).

[[def: authorizing set]]:
~ The signer set, with its threshold, that must sign an author entry of a set Original: the set in its parent entry's state, or the author alone if that state has none ([P5.20](#p5.20)).

[[def: parent Original, parent Originals]]:
~ An Original that another Original, its child, names in its `parent` member at genesis. The parent contributes editor grants only ([P5.24](#p5.24)).

[[def: pin, pins]]:
~ The versionId of the parent Original's log that a child entry names in `parent.versionId`; inherited grants are judged at it, and it never goes backwards ([P5.24](#p5.24)).

[[def: inherited grant, inherited grants]]:
~ A grant in a parent Original's `editors` at the version a child entry pins, which authorizes that child editor entry as a direct grant would ([P5.24](#p5.24)).

[[def: scope type, scope types]]:
~ The kind of restriction a grant's `scope` makes, which defines its members and how a verifier checks it, such as `paths` or `items` ([P5.28](#p5.28), [P5.29](#p5.29)).

[[def: path view]]:
~ A map from path to digest that a resource media type defines for its versions, against which a `paths` scope is checked ([P5.29](#p5.29)).

[[def: item view]]:
~ A map from item id to digest that a resource media type defines for its versions, against which an `items` scope is checked ([P5.29](#p5.29)).
