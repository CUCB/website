interface ExtractAttributesInput {
  prefs: {
    pref_type: {
      name: string;
    };
    value: boolean;
  }[];
}

export const extractAttributes = (query_data: ExtractAttributesInput): string[] =>
  query_data.prefs.filter((pref) => pref.value).map((pref) => pref.pref_type.name.slice("attribute.".length));
